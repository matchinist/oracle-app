import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { isAdmin } from '../lib/admin'
import './QuestionDetail.css'

export default function QuestionDetail() {
  const { id } = useParams()
  const { user, fetchProfile } = useAuth()
  const navigate = useNavigate()

  const [question, setQuestion] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [userPred, setUserPred] = useState(null)
  const [loading, setLoading] = useState(true)

  const [selectedOption, setSelectedOption] = useState(null)
  const [stake, setStake] = useState(5)
  const [submitting, setSubmitting] = useState(false)
  const [predError, setPredError] = useState('')

  const [resolving, setResolving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => { fetchData() }, [id])

  async function fetchData() {
    const { data: q } = await supabase
      .from('questions')
      .select(`*, profiles(username)`)
      .eq('id', id)
      .single()

    const { data: preds } = await supabase
      .from('predictions')
      .select(`*, profiles(username)`)
      .eq('question_id', id)
      .order('created_at', { ascending: false })

    setQuestion(q)
    setPredictions(preds || [])
    setUserPred(preds?.find(p => p.user_id === user?.id) || null)
    setLoading(false)
  }

  async function handlePredict() {
    if (!selectedOption) { setPredError('Pick an option first.'); return }
    setSubmitting(true)
    setPredError('')
    const { error } = await supabase.from('predictions').insert({
      question_id: id,
      user_id: user.id,
      selected_option: selectedOption,
      stake,
    })
    if (error) { setPredError(error.message); setSubmitting(false); return }
    await fetchData()
    setSubmitting(false)
  }

  async function handleResolve(correct) {
    setResolving(true)
    const { error } = await supabase.rpc('resolve_question', { q_id: id, correct_opt: correct })
    if (!error) { await fetchData(); await fetchProfile(user.id) }
    setResolving(false)
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function getOptionCount(opt) {
    return predictions.filter(p => p.selected_option === opt).length
  }

  function getOptionPct(opt) {
    if (!predictions.length) return 0
    return Math.round((getOptionCount(opt) / predictions.length) * 100)
  }

  function getOdds(opt) {
    return opt === 'a' ? question?.odds_a : question?.odds_b
  }

  function getPotentialWin() {
    if (!selectedOption) return null
    const odds = getOdds(selectedOption)
    return Math.round(stake * odds)
  }

  if (loading) return <div className="page-wrap"><div className="loading-text mono">Loading...</div></div>
  if (!question) return <div className="page-wrap"><p>Question not found.</p></div>

  const adminUser = isAdmin(user)

  return (
    <div className="page-wrap">
      <button className="back-btn mono" onClick={() => navigate('/')}>← Back</button>

      <div className="qd-card card">
        <div className="qd-top">
          <div className="qd-meta">
            <span className="mono" style={{color:'var(--text-muted)', fontSize:'0.8rem'}}>by @{question.profiles?.username}</span>
            <span className={`qcard-status ${question.is_resolved ? 'resolved' : 'open'}`}>
              {question.is_resolved ? '✓ Resolved' : '● Open'}
            </span>
          </div>
          <button className="share-btn" onClick={handleShare}>
            {copied ? '✓ Copied!' : '⎘ Share Link'}
          </button>
        </div>

        <h2 className="qd-question">{question.question}</h2>

        {/* Options with vote bars */}
        <div className="qd-options">
          {['a','b'].map(opt => {
            const label = opt === 'a' ? question.option_a : question.option_b
            const odds = getOdds(opt)
            const pct = getOptionPct(opt)
            const isCorrect = question.is_resolved && question.correct_option === opt
            const isUserChoice = userPred?.selected_option === opt
            return (
              <div
                key={opt}
                className={`qd-option ${isCorrect ? 'correct' : ''} ${isUserChoice ? 'user-choice' : ''} ${!userPred && !question.is_resolved ? 'selectable' : ''} ${selectedOption === opt ? 'selected' : ''}`}
                onClick={() => { if (!userPred && !question.is_resolved) setSelectedOption(opt) }}
              >
                <div className="qd-option-bar" style={{width: `${pct}%`}} />
                <div className="qd-option-content">
                  <span className="qd-option-letter">{opt.toUpperCase()}</span>
                  <span className="qd-option-label">{label}</span>
                  <div className="qd-option-right">
                    <span className="qd-odds mono">{odds}x</span>
                    <span className="qd-option-pct mono">{pct}%</span>
                  </div>
                </div>
                {isCorrect && <span className="correct-badge">✓ Correct</span>}
                {isUserChoice && !question.is_resolved && <span className="your-pick-badge">Your pick</span>}
              </div>
            )
          })}
        </div>

        {/* Predict form */}
        {!userPred && !question.is_resolved && (
          <div className="predict-section">
            <div className="stake-row">
              <label className="label">Stake (1–10)</label>
              <div className="stake-controls">
                <button className="stake-btn" onClick={() => setStake(s => Math.max(1, s-1))}>−</button>
                <span className="stake-val mono">{stake}</span>
                <button className="stake-btn" onClick={() => setStake(s => Math.min(10, s+1))}>+</button>
              </div>
            </div>
            <p className="stake-hint mono">
              {selectedOption
                ? `Win → +${getPotentialWin()} pts · Lose → −${stake} pts`
                : 'Select an option above to see potential payout'}
            </p>
            {predError && <p className="error-msg">{predError}</p>}
            <button className="btn-primary" onClick={handlePredict} disabled={submitting || !selectedOption} style={{marginTop:'12px'}}>
              {submitting ? 'Locking in...' : 'Lock Prediction'}
            </button>
          </div>
        )}

        {/* User's prediction result */}
        {userPred && (
          <div className={`user-result ${userPred.points_result === null ? 'pending' : userPred.points_result >= 0 ? 'win' : 'lose'}`}>
            <span className="user-result-label">Your Prediction</span>
            <span className="user-result-choice">
              {userPred.selected_option === 'a' ? question.option_a : question.option_b}
            </span>
            <span className="user-result-points mono">
              {userPred.points_result === null
                ? `Staked ${userPred.stake} · Awaiting result`
                : `${userPred.points_result > 0 ? '+' : ''}${userPred.points_result} pts`}
            </span>
          </div>
        )}

        {/* Resolve section for admin only */}
        {adminUser && !question.is_resolved && (
          <div className="resolve-section">
            <p className="label">Mark the correct answer:</p>
            <div className="resolve-btns">
              <button className="resolve-opt-btn" onClick={() => handleResolve('a')} disabled={resolving}>
                ✓ {question.option_a}
              </button>
              <button className="resolve-opt-btn" onClick={() => handleResolve('b')} disabled={resolving}>
                ✓ {question.option_b}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Predictions list */}
      {predictions.length > 0 && (
        <div className="preds-section">
          <h3 className="preds-title">
            {predictions.length} Prediction{predictions.length !== 1 ? 's' : ''}
          </h3>
          <div className="preds-list">
            {predictions.map(p => (
              <div key={p.id} className="pred-row">
                <span className="pred-user mono">@{p.profiles?.username}</span>
                <span className="pred-choice">
                  {p.selected_option === 'a' ? question.option_a : question.option_b}
                </span>
                <span className="pred-stake mono">
                  stake {p.stake} · {p.selected_option === 'a' ? question.odds_a : question.odds_b}x
                </span>
                {p.points_result !== null && (
                  <span className={`pred-result mono ${p.points_result >= 0 ? 'win' : 'lose'}`}>
                    {p.points_result > 0 ? '+' : ''}{p.points_result}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { isAdmin } from '../lib/admin'
import './CreateQuestion.css'

export default function CreateQuestion() {
  const [question, setQuestion] = useState('')
  const [optionA, setOptionA] = useState('')
  const [optionB, setOptionB] = useState('')
  const [oddsA, setOddsA] = useState('')
  const [oddsB, setOddsB] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!isAdmin(user)) {
    return (
      <div className="page-wrap">
        <div className="not-admin">
          <span className="not-admin-icon">⬡</span>
          <h2>Oracles only.</h2>
          <p className="mono">Only the admin can create questions.</p>
          <button className="btn-ghost" onClick={() => navigate('/')} style={{marginTop:'16px'}}>← Back</button>
        </div>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const parsedA = parseFloat(oddsA)
    const parsedB = parseFloat(oddsB)

    if (!question.trim() || !optionA.trim() || !optionB.trim()) {
      setError('All fields are required.'); return
    }
    if (isNaN(parsedA) || parsedA <= 0 || isNaN(parsedB) || parsedB <= 0) {
      setError('Odds must be positive numbers (e.g. 1.5 or 3).'); return
    }

    setLoading(true)
    const { data, error: err } = await supabase
      .from('questions')
      .insert({
        question: question.trim(),
        option_a: optionA.trim(),
        option_b: optionB.trim(),
        odds_a: parsedA,
        odds_b: parsedB,
        creator_id: user.id
      })
      .select()
      .single()

    if (err) { setError(err.message); setLoading(false); return }
    navigate(`/question/${data.id}`)
  }

  return (
    <div className="page-wrap">
      <div className="create-header">
        <h2 className="page-title">New Question</h2>
        <p className="page-sub mono">Set the stage. Define the odds.</p>
      </div>

      <div className="card create-card">
        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label className="label">The Question</label>
            <input
              className="input-field"
              type="text"
              placeholder="Who will win the AoE match tonight?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              maxLength={200}
            />
            <span className="char-count mono">{question.length}/200</span>
          </div>

          <div className="options-row">
            <div className="option-block">
              <label className="label">Option A</label>
              <input
                className="input-field option-a"
                type="text"
                placeholder="First outcome"
                value={optionA}
                onChange={e => setOptionA(e.target.value)}
                maxLength={80}
              />
              <div className="odds-row">
                <label className="label" style={{marginBottom:0}}>Odds</label>
                <input
                  className="input-field odds-input"
                  type="number"
                  placeholder="e.g. 1.5"
                  step="0.1"
                  min="0.1"
                  value={oddsA}
                  onChange={e => setOddsA(e.target.value)}
                />
                <span className="odds-hint mono">× stake if wins</span>
              </div>
            </div>

            <div className="vs-divider">VS</div>

            <div className="option-block">
              <label className="label">Option B</label>
              <input
                className="input-field option-b"
                type="text"
                placeholder="Second outcome"
                value={optionB}
                onChange={e => setOptionB(e.target.value)}
                maxLength={80}
              />
              <div className="odds-row">
                <label className="label" style={{marginBottom:0}}>Odds</label>
                <input
                  className="input-field odds-input"
                  type="number"
                  placeholder="e.g. 3"
                  step="0.1"
                  min="0.1"
                  value={oddsB}
                  onChange={e => setOddsB(e.target.value)}
                />
                <span className="odds-hint mono">× stake if wins</span>
              </div>
            </div>
          </div>

          <div className="odds-preview">
            <span className="label" style={{marginBottom:0}}>Example payout</span>
            <span className="mono" style={{color:'var(--text-muted)', fontSize:'0.82rem'}}>
              Stake 5 on A → {oddsA ? `+${Math.round(5 * parseFloat(oddsA)) || '?'}` : '?'} pts win / −5 pts lose &nbsp;·&nbsp;
              Stake 5 on B → {oddsB ? `+${Math.round(5 * parseFloat(oddsB)) || '?'}` : '?'} pts win / −5 pts lose
            </span>
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="create-actions">
            <button type="button" className="btn-ghost" onClick={() => navigate('/')}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create & Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

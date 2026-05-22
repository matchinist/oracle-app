import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import './Questions.css'

export default function Questions() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchQuestions()
  }, [])

  async function fetchQuestions() {
    const { data } = await supabase
      .from('questions')
      .select(`*, profiles(username), predictions(id, user_id, selected_option, stake, points_result)`)
      .order('created_at', { ascending: false })
    setQuestions(data || [])
    setLoading(false)
  }

  function getUserPrediction(q) {
    return q.predictions?.find(p => p.user_id === user?.id)
  }

  function getPredictionCount(q) {
    return q.predictions?.length || 0
  }

  if (loading) return <div className="page-wrap"><div className="loading-text mono">Loading questions...</div></div>

  return (
    <div className="page-wrap">
      <div className="questions-header">
        <div>
          <h2 className="page-title">All Predictions</h2>
          <p className="page-sub mono">{questions.length} questions in the arena</p>
        </div>
        <Link to="/create" className="btn-primary">+ New Question</Link>
      </div>

      {questions.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">⬡</span>
          <p>No questions yet. Be the first oracle.</p>
          <Link to="/create" className="btn-primary" style={{marginTop: '16px', display:'inline-block'}}>Create Question</Link>
        </div>
      ) : (
        <div className="questions-list">
          {questions.map(q => {
            const userPred = getUserPrediction(q)
            const predCount = getPredictionCount(q)
            return (
              <Link to={`/question/${q.id}`} key={q.id} className="question-card">
                <div className="qcard-top">
                  <div className="qcard-meta">
                    <span className="qcard-author mono">@{q.profiles?.username}</span>
                    <span className={`qcard-status ${q.is_resolved ? 'resolved' : 'open'}`}>
                      {q.is_resolved ? '✓ Resolved' : '● Open'}
                    </span>
                  </div>
                  {userPred && (
                    <div className={`qcard-your-pred ${userPred.points_result !== null ? (userPred.points_result >= 0 ? 'pred-win' : 'pred-lose') : 'pred-pending'}`}>
                      {userPred.points_result !== null
                        ? `${userPred.points_result > 0 ? '+' : ''}${userPred.points_result} pts`
                        : `Staked ${userPred.stake}`
                      }
                    </div>
                  )}
                </div>

                <h3 className="qcard-question">{q.question}</h3>

                <div className="qcard-options">
                  <span className={`qcard-option ${q.is_resolved && q.correct_option === 'a' ? 'correct' : ''}`}>
                    A: {q.option_a}
                  </span>
                  <span className="qcard-vs">vs</span>
                  <span className={`qcard-option ${q.is_resolved && q.correct_option === 'b' ? 'correct' : ''}`}>
                    B: {q.option_b}
                  </span>
                </div>

                <div className="qcard-footer">
                  <span className="mono" style={{color:'var(--text-muted)', fontSize:'0.8rem'}}>
                    {predCount} prediction{predCount !== 1 ? 's' : ''}
                  </span>
                  <span style={{color:'var(--text-muted)', fontSize:'0.8rem'}}>→</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

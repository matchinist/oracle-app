import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { isAdmin } from '../lib/admin'
import './Questions.css'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function Questions() {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => { fetchQuestions() }, [])

  async function fetchQuestions() {
    const { data } = await supabase
      .from('questions')
      .select(`*, predictions(id, user_id, selected_option, stake, points_result)`)
      .order('created_at', { ascending: false })
    setQuestions(data || [])
    setLoading(false)
  }

  function getUserPrediction(q) {
    return q.predictions?.find(p => p.user_id === user?.id)
  }

  function isLocked(q) {
    return q.lock_date && new Date() > new Date(q.lock_date)
  }

  if (loading) return <div className="page-wrap"><div className="loading-text mono">Yükleniyor...</div></div>

  return (
    <div className="page-wrap">
      <div className="questions-header">
        <div>
          <h2 className="page-title">Sorular</h2>
          <p className="page-sub mono">{questions.length} soru arenada</p>
        </div>
        {isAdmin(user) && <Link to="/create" className="btn-primary">+ Yeni Soru</Link>}
      </div>

      {questions.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">⬡</span>
          <p>Henüz soru yok.</p>
        </div>
      ) : (
        <div className="questions-list">
          {questions.map(q => {
            const userPred = getUserPrediction(q)
            const predCount = q.predictions?.length || 0
            const locked = isLocked(q)
            return (
              <Link to={`/question/${q.id}`} key={q.id} className="question-card">
                <div className="qcard-top">
                  <div className="qcard-meta">
                    {q.category && <span className="qcard-category">{q.category}</span>}
                    <span className={`qcard-status ${q.is_resolved ? 'resolved' : locked ? 'locked' : 'open'}`}>
                      {q.is_resolved ? '✓ Sonuçlandı' : locked ? '🔒 Kilitlendi' : '● Açık'}
                    </span>
                  </div>
                  {userPred && (
                    <div className={`qcard-your-pred ${userPred.points_result !== null ? (userPred.points_result >= 0 ? 'pred-win' : 'pred-lose') : 'pred-pending'}`}>
                      {userPred.points_result !== null
                        ? `${userPred.points_result > 0 ? '+' : ''}${userPred.points_result} puan`
                        : `Bahis: ${userPred.stake}`}
                    </div>
                  )}
                </div>

                <h3 className="qcard-question">{q.question}</h3>

                <div className="qcard-options">
                  <span className={`qcard-option ${q.is_resolved && q.correct_option === 'a' ? 'correct' : ''}`}>A: {q.option_a}</span>
                  <span className="qcard-vs">vs</span>
                  <span className={`qcard-option ${q.is_resolved && q.correct_option === 'b' ? 'correct' : ''}`}>B: {q.option_b}</span>
                </div>

                <div className="qcard-footer">
                  <span className="mono" style={{fontSize:'0.8rem'}}>{predCount} tahmin</span>
                  {q.lock_date && (
                    <span className="qcard-lockdate mono">
                      {locked || q.is_resolved ? `Kilitlendi: ${formatDate(q.lock_date)}` : `⏱ ${formatDate(q.lock_date)}'de kapanır`}
                    </span>
                  )}
                  <span style={{fontSize:'0.8rem'}}>→</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import './Leaderboard.css'

export default function Leaderboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase
        .from('profiles')
        .select('*, predictions(id, points_result)')
        .order('total_points', { ascending: false })
      setUsers(data || [])
      setLoading(false)
    }
    fetchUsers()
  }, [])

  function getAccuracy(u) {
    const resolved = u.predictions?.filter(p => p.points_result !== null) || []
    if (!resolved.length) return null
    const wins = resolved.filter(p => p.points_result > 0).length
    return Math.round((wins / resolved.length) * 100)
  }

  function getTotalPredictions(u) {
    return u.predictions?.length || 0
  }

  if (loading) return <div className="page-wrap"><div className="loading-text mono">Yükleniyor...</div></div>

  return (
    <div className="page-wrap">
      <div className="lb-header">
        <h2 className="page-title">Sıralama</h2>
        <p className="page-sub mono">Geleceği en iyi kim görüyor?</p>
      </div>

      <div className="lb-list">
        {users.map((u, i) => {
          const accuracy = getAccuracy(u)
          const totalPreds = getTotalPredictions(u)
          const isMe = u.id === user?.id
          const rank = i + 1

          return (
            <div key={u.id} className={`lb-row ${isMe ? 'is-me' : ''}`}>
              <div className={`lb-rank ${rank <= 3 ? `top-${rank}` : ''}`}>
                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : <span className="mono">#{rank}</span>}
              </div>
              <div className="lb-user">
                <span className="lb-username">
                  {u.username}
                  {isMe && <span className="you-badge">sen</span>}
                </span>
                <span className="lb-preds mono">{totalPreds} tahmin</span>
              </div>
              <div className="lb-stats">
                {accuracy !== null && (
                  <div className="lb-stat">
                    <span className="lb-stat-val mono">{accuracy}%</span>
                    <span className="lb-stat-label">isabet</span>
                  </div>
                )}
                <div className="lb-points">
                  <span className={`lb-points-val mono ${u.total_points >= 0 ? 'pos' : 'neg'}`}>
                    {u.total_points > 0 ? '+' : ''}{u.total_points}
                  </span>
                  <span className="lb-stat-label">puan</span>
                </div>
              </div>
            </div>
          )
        })}
        {users.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">⬡</span>
            <p>Henüz oracle yok. İlk sen ol.</p>
          </div>
        )}
      </div>
    </div>
  )
}

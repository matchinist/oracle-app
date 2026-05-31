import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import './Leaderboard.css'

export default function Leaderboard() {
  const [categories, setCategories] = useState([])
  const [profiles, setProfiles] = useState([])
  const [allPredictions, setAllPredictions] = useState([])
  const [questions, setQuestions] = useState([])
  const [activeTab, setActiveTab] = useState('overall')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [{ data: cats }, { data: profs }, { data: preds }, { data: qs }] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('profiles').select('*'),
      supabase.from('predictions').select('*, questions(category_id)').not('points_result', 'is', null),
      supabase.from('questions').select('id, category_id'),
    ])
    setCategories(cats || [])
    setProfiles(profs || [])
    setAllPredictions(preds || [])
    setQuestions(qs || [])
    setLoading(false)
  }

  function getCategoryPoints(userId, categoryId) {
    return allPredictions
      .filter(p => p.user_id === userId && p.questions?.category_id === categoryId)
      .reduce((sum, p) => sum + (p.points_result || 0), 0)
  }

  function getCategoryPredictions(userId, categoryId) {
    return allPredictions.filter(p => p.user_id === userId && p.questions?.category_id === categoryId)
  }

  function getAccuracy(preds) {
    const resolved = preds.filter(p => p.points_result !== null)
    if (!resolved.length) return null
    const wins = resolved.filter(p => p.points_result > 0).length
    return Math.round((wins / resolved.length) * 100)
  }

  function buildRanking(getUserPoints, getUserPreds) {
    return profiles
      .map(u => ({
        ...u,
        pts: getUserPoints(u.id),
        preds: getUserPreds(u.id),
      }))
      .sort((a, b) => b.pts - a.pts)
  }

  const overallRanking = buildRanking(
    (uid) => profiles.find(p => p.id === uid)?.total_points || 0,
    (uid) => allPredictions.filter(p => p.user_id === uid)
  )

  function renderTable(ranking) {
    if (ranking.length === 0) return <div className="empty-state"><span className="empty-icon">⬡</span><p>Henüz tahmin yok.</p></div>
    return (
      <div className="lb-list">
        {ranking.map((u, i) => {
          const accuracy = getAccuracy(u.preds)
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
                <span className="lb-preds mono">{u.preds.length} tahmin</span>
              </div>
              <div className="lb-stats">
                {accuracy !== null && (
                  <div className="lb-stat">
                    <span className="lb-stat-val mono">{accuracy}%</span>
                    <span className="lb-stat-label">isabet</span>
                  </div>
                )}
                <div className="lb-points">
                  <span className={`lb-points-val mono ${u.pts >= 0 ? 'pos' : 'neg'}`}>
                    {u.pts > 0 ? '+' : ''}{u.pts}
                  </span>
                  <span className="lb-stat-label">puan</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) return <div className="page-wrap"><div className="loading-text mono">Yükleniyor...</div></div>

  return (
    <div className="page-wrap">
      <div className="lb-header">
        <h2 className="page-title">Sıralama</h2>
        <p className="page-sub mono">Geleceği en iyi kim görüyor?</p>
      </div>

      <div className="lb-tabs">
        <button className={`lb-tab ${activeTab === 'overall' ? 'active' : ''}`} onClick={() => setActiveTab('overall')}>
          Genel
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`lb-tab ${activeTab === cat.id ? 'active' : ''}`}
            onClick={() => setActiveTab(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {activeTab === 'overall' && renderTable(overallRanking)}

      {activeTab !== 'overall' && (() => {
        const cat = categories.find(c => c.id === activeTab)
        const ranking = buildRanking(
          (uid) => getCategoryPoints(uid, activeTab),
          (uid) => getCategoryPredictions(uid, activeTab)
        ).filter(u => u.preds.length > 0)
        return renderTable(ranking)
      })()}
    </div>
  )
}

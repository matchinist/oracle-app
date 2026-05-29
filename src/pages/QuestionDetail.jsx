import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import './QuestionDetail.css'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function QuestionDetail() {
  const { id } = useParams()
  const { user, fetchProfile } = useAuth()
  const navigate = useNavigate()

  const [question, setQuestion] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [userPred, setUserPred] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('tahmin')

  const [selectedOption, setSelectedOption] = useState(null)
  const [stake, setStake] = useState(5)
  const [submitting, setSubmitting] = useState(false)
  const [predError, setPredError] = useState('')

  const [resolving, setResolving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
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
    const myPred = preds?.find(p => p.user_id === user?.id) || null
    setUserPred(myPred)
    if (myPred) { setSelectedOption(myPred.selected_option); setStake(myPred.stake) }
    setLoading(false)
  }

  async function handlePredict() {
    if (!selectedOption) { setPredError('Bir seçenek seçin.'); return }
    setSubmitting(true)
    setPredError('')
    if (editing && userPred) {
      const { error } = await supabase.from('predictions').update({ selected_option: selectedOption, stake }).eq('id', userPred.id)
      if (error) { setPredError(error.message); setSubmitting(false); return }
      setEditing(false)
    } else {
      const { error } = await supabase.from('predictions').insert({ question_id: id, user_id: user.id, selected_option: selectedOption, stake })
      if (error) { setPredError(error.message); setSubmitting(false); return }
    }
    await fetchData()
    setSubmitting(false)
  }

  async function handleResolve(correct) {
    setResolving(true)
    const { error } = await supabase.rpc('resolve_question', { q_id: id, correct_opt: correct })
    if (!error) { await fetchData(); await fetchProfile(user.id) }
    setResolving(false)
  }

  async function handleDelete() {
    setDeleting(true)

    // Reverse points for resolved predictions before deleting
    const resolvedPreds = predictions.filter(p => p.points_result !== null)
    for (const p of resolvedPreds) {
      const { data: profile } = await supabase.from('profiles').select('total_points').eq('id', p.user_id).single()
      if (profile) {
        await supabase.from('profiles').update({ total_points: profile.total_points - p.points_result }).eq('id', p.user_id)
      }
    }

    const { error: predErr } = await supabase.from('predictions').delete().eq('question_id', id)
    if (predErr) { console.error(predErr); setDeleting(false); return }
    const { error: qErr } = await supabase.from('questions').delete().eq('id', id)
    if (qErr) { console.error(qErr); setDeleting(false); return }
    navigate('/')
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function getOptionPct(opt) {
    if (!predictions.length) return 0
    const count = predictions.filter(p => p.selected_option === opt).length
    return Math.round((count / predictions.length) * 100)
  }

  const isCreator = question?.creator_id === user?.id
  const isLocked = question?.lock_date && new Date() > new Date(question.lock_date)
  const canPredict = !question?.is_resolved && !isLocked
  const showPredictForm = canPredict && (!userPred || editing)

  if (loading) return <div className="page-wrap"><div className="loading-text mono">Yükleniyor...</div></div>
  if (!question) return <div className="page-wrap"><p>Soru bulunamadı.</p></div>

  return (
    <div className="page-wrap">
      <button className="back-btn mono" onClick={() => navigate('/')}>← Geri</button>

      <div className="qd-card card">
        <div className="qd-top">
          <div className="qd-meta">
            <span className="mono" style={{color:'var(--text-muted)', fontSize:'0.8rem'}}>@{question.profiles?.username} tarafından</span>
            {question.category && <span className="qd-category">{question.category}</span>}
            <span className={`qcard-status ${question.is_resolved ? 'resolved' : isLocked ? 'locked' : 'open'}`}>
              {question.is_resolved ? '✓ Sonuçlandı' : isLocked ? '🔒 Kilitlendi' : '● Açık'}
            </span>
          </div>
          <button className="share-btn" onClick={handleShare}>
            {copied ? '✓ Kopyalandı!' : '⎘ Paylaş'}
          </button>
        </div>

        <h2 className="qd-question">{question.question}</h2>

        {question.lock_date && (
          <div className="lock-info mono">
            {question.is_resolved
              ? `✓ Sonuçlandı · Kilitlenme: ${formatDate(question.lock_date)}`
              : isLocked
              ? `🔒 Tahminler kapandı · ${formatDate(question.lock_date)}`
              : `⏱ Tahminler ${formatDate(question.lock_date)} tarihinde kapanır`}
          </div>
        )}

        {/* Tabs */}
        <div className="detail-tabs">
          <button className={`detail-tab ${activeTab === 'tahmin' ? 'active' : ''}`} onClick={() => setActiveTab('tahmin')}>
            Tahmin
          </button>
          {isCreator && (
            <button className={`detail-tab admin-tab ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
              Admin
            </button>
          )}
        </div>

        {/* TAHMİN TAB */}
        {activeTab === 'tahmin' && (
          <>
            <div className="qd-options">
              {['a','b'].map(opt => {
                const label = opt === 'a' ? question.option_a : question.option_b
                const pct = getOptionPct(opt)
                const isCorrect = question.is_resolved && question.correct_option === opt
                const isUserChoice = userPred?.selected_option === opt
                return (
                  <div
                    key={opt}
                    className={`qd-option ${isCorrect ? 'correct' : ''} ${isUserChoice && !editing ? 'user-choice' : ''} ${showPredictForm ? 'selectable' : ''} ${selectedOption === opt && showPredictForm ? 'selected' : ''}`}
                    onClick={() => { if (showPredictForm) setSelectedOption(opt) }}
                  >
                    <div className="qd-option-bar" style={{width: `${pct}%`}} />
                    <div className="qd-option-content">
                      <span className="qd-option-letter">{opt.toUpperCase()}</span>
                      <span className="qd-option-label">{label}</span>
                      <span className="qd-option-pct mono">{pct}%</span>
                    </div>
                    {isCorrect && <span className="correct-badge">✓ Doğru</span>}
                  </div>
                )
              })}
            </div>

            {showPredictForm && (
              <div className="predict-section">
                <div className="stake-row">
                  <label className="label">Bahis (1–10)</label>
                  <div className="stake-controls">
                    <button className="stake-btn" onClick={() => setStake(s => Math.max(1, s-1))}>−</button>
                    <span className="stake-val mono">{stake}</span>
                    <button className="stake-btn" onClick={() => setStake(s => Math.min(10, s+1))}>+</button>
                  </div>
                </div>
                <p className="stake-hint mono">
                  {selectedOption ? `Doğru → +${stake} puan · Yanlış → −${stake} puan` : 'Önce bir seçenek seçin'}
                </p>
                {predError && <p className="error-msg">{predError}</p>}
                <div style={{display:'flex', gap:'10px', marginTop:'12px'}}>
                  <button className="btn-primary" onClick={handlePredict} disabled={submitting || !selectedOption}>
                    {submitting ? 'Kaydediliyor...' : editing ? 'Tahmini Güncelle' : 'Tahmini Kaydet'}
                  </button>
                  {editing && (
                    <button className="btn-ghost" onClick={() => { setEditing(false); setSelectedOption(userPred.selected_option); setStake(userPred.stake) }}>İptal</button>
                  )}
                </div>
              </div>
            )}

            {userPred && !editing && (
              <div className={`user-result ${userPred.points_result === null ? 'pending' : userPred.points_result >= 0 ? 'win' : 'lose'}`}>
                <div className="user-result-left">
                  <span className="user-result-label">Tahmininiz</span>
                  <span className="user-result-choice">{userPred.selected_option === 'a' ? question.option_a : question.option_b}</span>
                  <span className="user-result-points mono">
                    {userPred.points_result === null ? `Bahis: ${userPred.stake} puan · Sonuç bekleniyor` : `${userPred.points_result > 0 ? '+' : ''}${userPred.points_result} puan`}
                  </span>
                </div>
                {canPredict && (
                  <button className="btn-ghost" style={{fontSize:'0.75rem', padding:'6px 14px'}} onClick={() => setEditing(true)}>Değiştir</button>
                )}
              </div>
            )}

            {!userPred && isLocked && !question.is_resolved && (
              <div className="locked-msg">Bu soru için tahmin süresi doldu.</div>
            )}
          </>
        )}

        {/* ADMİN TAB */}
        {activeTab === 'admin' && isCreator && (
          <div className="admin-tab-content">
            {!question.is_resolved && (
              <div className="admin-section">
                <h4 className="admin-section-title">✓ Doğru Cevabı İşaretle</h4>
                <p className="resolve-hint">⚠️ Doğru cevabı yalnızca sonuç kesinleştikten sonra işaretleyin. Bu işlem tüm tahminleri puanlandırır ve geri alınamaz.</p>
                <div className="resolve-btns" style={{marginTop:'14px'}}>
                  <button className="resolve-opt-btn" onClick={() => handleResolve('a')} disabled={resolving}>✓ {question.option_a}</button>
                  <button className="resolve-opt-btn" onClick={() => handleResolve('b')} disabled={resolving}>✓ {question.option_b}</button>
                </div>
              </div>
            )}

            {question.is_resolved && (
              <div className="admin-section">
                <p className="resolve-hint" style={{color:'var(--accent)'}}>✓ Bu soru sonuçlandırıldı. Doğru cevap: <strong>{question.correct_option === 'a' ? question.option_a : question.option_b}</strong></p>
              </div>
            )}

            <div className="admin-section admin-delete">
              <h4 className="admin-section-title">🗑 Soruyu Sil</h4>
              <p style={{fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'12px'}}>Bu soru ve tüm tahminler kalıcı olarak silinir.</p>
              {!confirmDelete ? (
                <button className="btn-danger" onClick={() => setConfirmDelete(true)}>Soruyu Sil</button>
              ) : (
                <div className="delete-confirm">
                  <p className="delete-warn">Emin misiniz? Bu işlem geri alınamaz.</p>
                  <div style={{display:'flex', gap:'10px', marginTop:'12px'}}>
                    <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                      {deleting ? 'Siliniyor...' : 'Evet, Sil'}
                    </button>
                    <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>İptal</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Predictions table */}
      {predictions.length > 0 && (
        <div className="preds-section">
          <h3 className="preds-title">{predictions.length} Tahmin</h3>
          <div className="preds-table">
            <div className="preds-table-header">
              <span>Kullanıcı</span>
              <span>Tahmin</span>
              <span>Bahis</span>
              <span>Tarih</span>
              <span>Sonuç</span>
            </div>
            {predictions.map(p => (
              <div key={p.id} className="pred-row">
                <span className="pred-user mono">@{p.profiles?.username}</span>
                <span className="pred-choice">{p.selected_option === 'a' ? question.option_a : question.option_b}</span>
                <span className="pred-stake mono">{p.stake}</span>
                <span className="pred-date mono">{formatDate(p.created_at)}</span>
                <span className={`pred-result mono ${p.points_result === null ? '' : p.points_result >= 0 ? 'win' : 'lose'}`}>
                  {p.points_result === null ? '—' : `${p.points_result > 0 ? '+' : ''}${p.points_result}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

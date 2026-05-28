import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import './CreateQuestion.css'

const CATEGORIES = [
  { value: 'spor', label: '⚽ Spor' },
  { value: 'politika', label: '🏛️ Politika' },
  { value: 'ekonomi', label: '📈 Ekonomi' },
  { value: 'eglence', label: '🎬 Eğlence' },
  { value: 'teknoloji', label: '💻 Teknoloji' },
  { value: 'diger', label: '🌐 Diğer' },
]

export default function CreateQuestion() {
  const [question, setQuestion] = useState('')
  const [optionA, setOptionA] = useState('')
  const [optionB, setOptionB] = useState('')
  const [lockDate, setLockDate] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const minDate = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!question.trim() || !optionA.trim() || !optionB.trim()) {
      setError('Tüm alanlar zorunludur.'); return
    }
    if (!category) {
      setError('Lütfen bir kategori seçin.'); return
    }
    if (!lockDate) {
      setError('Lütfen bir kilit tarihi belirleyin.'); return
    }
    setLoading(true)
    const { data, error: err } = await supabase
      .from('questions')
      .insert({
        question: question.trim(),
        option_a: optionA.trim(),
        option_b: optionB.trim(),
        lock_date: new Date(lockDate).toISOString(),
        category,
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
        <h2 className="page-title">Yeni Soru</h2>
        <p className="page-sub mono">Sahneyi kur. Arkadaşların tahmin etsin.</p>
      </div>

      <div className="create-tip">
        <span className="tip-icon">💡</span>
        <p>
          <strong>Gerçek bir yarışma yap.</strong> En iyi sorular, her iki sonucun da gerçekten mümkün göründüğü sorulardır. Cevabı herkes zaten biliyorsa tahmin etmekte eğlence kalmaz. Her gün kazanabilecek seçenekler bul.
        </p>
      </div>

      <div className="card create-card">
        <form onSubmit={handleSubmit} className="create-form">

          <div className="form-group">
            <label className="label">Kategori</label>
            <div className="category-grid">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  className={`category-btn ${category === cat.value ? 'active' : ''}`}
                  onClick={() => setCategory(cat.value)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="label">Soru</label>
            <input
              className="input-field"
              type="text"
              placeholder="Bu gece AoE maçını kim kazanır?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              maxLength={200}
            />
            <span className="char-count mono">{question.length}/200</span>
          </div>

          <div className="options-row">
            <div className="form-group" style={{flex:1}}>
              <label className="label">Seçenek A</label>
              <input className="input-field option-a" type="text" placeholder="Birinci sonuç" value={optionA} onChange={e => setOptionA(e.target.value)} maxLength={80} />
            </div>
            <div className="vs-divider">VS</div>
            <div className="form-group" style={{flex:1}}>
              <label className="label">Seçenek B</label>
              <input className="input-field option-b" type="text" placeholder="İkinci sonuç" value={optionB} onChange={e => setOptionB(e.target.value)} maxLength={80} />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Tahmin Kilit Tarihi</label>
            <input className="input-field" type="datetime-local" min={minDate} value={lockDate} onChange={e => setLockDate(e.target.value)} />
            <span className="field-hint mono">Bu tarihten sonra tahmin yapılamaz</span>
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="create-actions">
            <button type="button" className="btn-ghost" onClick={() => navigate('/')}>İptal</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Oluşturuluyor...' : 'Oluştur ve Paylaş'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

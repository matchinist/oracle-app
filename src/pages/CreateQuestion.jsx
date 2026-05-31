import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { isAdmin } from '../lib/admin'
import './CreateQuestion.css'

export default function CreateQuestion() {
  const [question, setQuestion] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [addingCategory, setAddingCategory] = useState(false)
  const [lockDate, setLockDate] = useState('')
  const [options, setOptions] = useState([
    { label: '', odds: '' },
    { label: '', odds: '' },
  ])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const minDate = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)

  useEffect(() => { fetchCategories() }, [])

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data || [])
  }

  const [pendingCategory, setPendingCategory] = useState(null) // { name } — not yet saved to DB

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return
    // Just store locally, don't save to DB yet
    setPendingCategory({ name: newCategoryName.trim() })
    setCategoryId('__pending__')
    setNewCategoryName('')
    setShowNewCategory(false)
  }

  if (!isAdmin(user)) {
    return (
      <div className="page-wrap">
        <div className="not-admin">
          <span className="not-admin-icon">⬡</span>
          <h2>Yalnızca yönetici.</h2>
          <p className="mono">Soru oluşturma yetkisi sadece adminde.</p>
          <button className="btn-ghost" onClick={() => navigate('/')} style={{marginTop:'16px'}}>← Geri</button>
        </div>
      </div>
    )
  }

  function updateOption(index, field, value) {
    setOptions(opts => opts.map((o, i) => i === index ? { ...o, [field]: value } : o))
  }

  function addOption() {
    setOptions(opts => [...opts, { label: '', odds: '' }])
  }

  function removeOption(index) {
    if (options.length <= 2) return
    setOptions(opts => opts.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!question.trim()) { setError('Soru alanı zorunludur.'); return }
    if (!categoryId) { setError('Lütfen bir kategori seçin.'); return }
    if (!lockDate) { setError('Lütfen bir kilit tarihi belirleyin.'); return }

    for (let i = 0; i < options.length; i++) {
      if (!options[i].label.trim()) { setError(`Seçenek ${i + 1} boş bırakılamaz.`); return }
      const odds = parseFloat(options[i].odds)
      if (isNaN(odds) || odds <= 0) { setError(`Seçenek ${i + 1} için geçerli bir oran girin (örn. 1.5).`); return }
    }

    setLoading(true)

    // If new category is pending, save it now
    let resolvedCategoryId = categoryId
    if (categoryId === '__pending__' && pendingCategory) {
      const { data: newCat, error: catErr } = await supabase
        .from('categories')
        .insert({ name: pendingCategory.name, created_by: user.id })
        .select()
        .single()
      if (catErr) { setError(catErr.message); setLoading(false); return }
      resolvedCategoryId = newCat.id
    }

    const { data: q, error: qErr } = await supabase
      .from('questions')
      .insert({
        question: question.trim(),
        category_id: resolvedCategoryId,
        lock_date: new Date(lockDate).toISOString(),
        creator_id: user.id
      })
      .select()
      .single()

    if (qErr) { setError(qErr.message); setLoading(false); return }

    const optionRows = options.map((o, i) => ({
      question_id: q.id,
      label: o.label.trim(),
      odds: parseFloat(o.odds),
      order_index: i,
    }))

    const { error: optErr } = await supabase.from('question_options').insert(optionRows)
    if (optErr) { setError(optErr.message); setLoading(false); return }

    navigate(`/question/${q.id}`)
  }

  return (
    <div className="page-wrap">
      <div className="create-header">
        <h2 className="page-title">Yeni Soru</h2>
        <p className="page-sub mono">Sahneyi kur. Kullanıcılar tahmin etsin.</p>
      </div>

      <div className="create-tip">
        <span className="tip-icon">💡</span>
        <p><strong>Gerçek bir yarışma yap.</strong> Her seçeneğin gerçekten kazanma şansı olsun. Oranlar seçeneğin zorluk derecesini yansıtmalı — favoriler düşük oran, sürprizler yüksek oran alır.</p>
      </div>

      <div className="card create-card">
        <form onSubmit={handleSubmit} className="create-form">

          <div className="form-group">
            <label className="label">Kategori</label>
            <div className="category-select-row">
              <select
                className="input-field"
                value={categoryId}
                onChange={e => { setCategoryId(e.target.value); if (e.target.value !== '__pending__') setPendingCategory(null) }}
              >
                <option value="">— Kategori seçin —</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
                {pendingCategory && (
                  <option value="__pending__">{pendingCategory.name} (yeni)</option>
                )}
              </select>
              <button type="button" className="add-category-btn" onClick={() => setShowNewCategory(v => !v)}>
                {showNewCategory ? '✕' : '+ Yeni'}
              </button>
            </div>
            {showNewCategory && (
              <div className="new-category-row">
                <input
                  className="input-field"
                  type="text"
                  placeholder="Kategori adı (örn. Basketbol)"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  maxLength={40}
                />
                <button type="button" className="btn-primary" style={{padding:'10px 18px', fontSize:'0.82rem'}} onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                  Ekle
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="label">Soru</label>
            <input className="input-field" type="text"
              placeholder="Bu gece AoE maçını kim kazanır?"
              value={question} onChange={e => setQuestion(e.target.value)} maxLength={200} />
            <span className="char-count mono">{question.length}/200</span>
          </div>

          <div className="form-group">
            <label className="label">Seçenekler ve Oranlar</label>
            <div className="options-list">
              {options.map((opt, i) => (
                <div key={i} className="option-row">
                  <span className="option-index mono">{i + 1}</span>
                  <input
                    className="input-field option-label"
                    type="text"
                    placeholder={`Seçenek ${i + 1}`}
                    value={opt.label}
                    onChange={e => updateOption(i, 'label', e.target.value)}
                    maxLength={80}
                  />
                  <div className="odds-input-wrap">
                    <input
                      className="input-field odds-field"
                      type="number"
                      placeholder="2.0"
                      step="0.1"
                      min="1"
                      value={opt.odds}
                      onChange={e => updateOption(i, 'odds', e.target.value)}
                    />
                    <span className="odds-x">×</span>
                  </div>
                  {options.length > 2 && (
                    <button type="button" className="remove-option-btn" onClick={() => removeOption(i)}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" className="add-option-btn" onClick={addOption}>+ Seçenek Ekle</button>
            <span className="field-hint mono">Doğru tahmin: bahis × oran puan · Yanlış tahmin: −bahis puan</span>
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

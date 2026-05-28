import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Auth.css'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }
      })
      if (error) setError(error.message)
      else navigate('/')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-glow" />
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">⬡</span>
          <h1 className="auth-title">ORACLE</h1>
          <p className="auth-subtitle">Tahmin et. Bahse gir. Haklı olduğunu kanıtla.</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError('') }}>Giriş Yap</button>
          <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setError('') }}>Kayıt Ol</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label className="label">Kullanıcı Adı</label>
              <input className="input-field" type="text" placeholder="kullanici_adi" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
          )}
          <div className="form-group">
            <label className="label">E-posta</label>
            <input className="input-field" type="email" placeholder="sen@ornek.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label">Şifre</label>
            <input className="input-field" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading} style={{width:'100%', marginTop: '8px'}}>
            {loading ? 'Yükleniyor...' : mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
          </button>
        </form>
      </div>
    </div>
  )
}

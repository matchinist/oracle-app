import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import './CreateQuestion.css'

export default function CreateQuestion() {
  const [question, setQuestion] = useState('')
  const [optionA, setOptionA] = useState('')
  const [optionB, setOptionB] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!question.trim() || !optionA.trim() || !optionB.trim()) {
      setError('All fields are required.')
      return
    }
    setLoading(true)
    const { data, error: err } = await supabase
      .from('questions')
      .insert({
        question: question.trim(),
        option_a: optionA.trim(),
        option_b: optionB.trim(),
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
        <p className="page-sub mono">Set the stage. Let your friends predict.</p>
      </div>

      <div className="create-tip">
        <span className="tip-icon">💡</span>
        <p>
          <strong>Make it a real contest.</strong> The best questions are ones where both outcomes feel genuinely possible — not a clear favourite vs. a long shot. If everyone already knows the answer, there's no fun in predicting. Aim for options that could each win on a given day.
        </p>
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
            <div className="form-group" style={{flex:1}}>
              <label className="label">Option A</label>
              <input
                className="input-field option-a"
                type="text"
                placeholder="First outcome"
                value={optionA}
                onChange={e => setOptionA(e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="vs-divider">VS</div>
            <div className="form-group" style={{flex:1}}>
              <label className="label">Option B</label>
              <input
                className="input-field option-b"
                type="text"
                placeholder="Second outcome"
                value={optionB}
                onChange={e => setOptionB(e.target.value)}
                maxLength={80}
              />
            </div>
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

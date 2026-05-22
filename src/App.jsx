import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Navbar from './components/Navbar'
import Auth from './pages/Auth'
import Questions from './pages/Questions'
import CreateQuestion from './pages/CreateQuestion'
import QuestionDetail from './pages/QuestionDetail'
import Leaderboard from './pages/Leaderboard'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{padding:'60px', textAlign:'center', color:'var(--text-muted)', fontFamily:'DM Mono'}}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Auth />} />
        <Route path="/" element={<ProtectedRoute><Questions /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreateQuestion /></ProtectedRoute>} />
        <Route path="/question/:id" element={<ProtectedRoute><QuestionDetail /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/oracle-app">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

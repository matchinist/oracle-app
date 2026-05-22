import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { isAdmin } from '../lib/admin'
import './Navbar.css'

export default function Navbar() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-text">ORACLE</span>
        </Link>

        {user && (
          <div className="navbar-links">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Questions</Link>
            <Link to="/leaderboard" className={`nav-link ${location.pathname === '/leaderboard' ? 'active' : ''}`}>Leaderboard</Link>
            {isAdmin(user) && (
              <Link to="/create" className="btn-primary" style={{padding: '8px 20px', fontSize: '0.8rem'}}>+ New</Link>
            )}
            <div className="nav-profile">
              <span className="nav-username mono">@{profile?.username}</span>
              <span className="nav-points">
                <span className={profile?.total_points >= 0 ? 'points-pos' : 'points-neg'}>
                  {profile?.total_points > 0 ? '+' : ''}{profile?.total_points ?? 0}
                </span>
                <span className="points-label">pts</span>
              </span>
              <button className="btn-ghost" style={{padding: '6px 14px', fontSize: '0.75rem'}} onClick={handleSignOut}>Out</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

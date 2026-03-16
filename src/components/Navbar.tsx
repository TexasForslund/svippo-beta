import { Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { auth } from '../firebase'
import { db } from '../firebase'
import useAuth from '../hooks/useAuth'
import CreateModal from './CreateModal'
import SearchBar from './SearchBar'
import './Navbar.css'
import logo from '../assets/logo.svg'

function Navbar() {
  const { user, loading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  useEffect(() => {
    if (!user) return
    const fetchUnread = async () => {
      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid),
          where('read', '==', false)
        )
        const snap = await getDocs(q)
        setUnreadCount(snap.size)
      } catch (err) {
        console.error(err)
      }
    }
    fetchUnread()
  }, [user, location]) // ← lägg till location här

  const [showCreate, setShowCreate] = useState(false)

  const handleSignOut = async () => {
    await signOut(auth)
    setMenuOpen(false)
  }

  return (
    <nav className="navbar">
      <div className="container navbar__inner">

        <Link to="/" className="navbar__logo">
          <img src={logo} alt="Svippo" height={36} />
        </Link>

        <div className="navbar__links">
          <Link to="/tjanster" className="navbar__link">Tjänster</Link>
          <Link to="/forfragningar" className="navbar__link">Förfrågningar</Link>
        </div>

        <SearchBar />

        <div className="navbar__actions">
          {!loading && (
            <>
              {user ? (
                <>
                  <Link to="/notifikationer" className="navbar__notif-btn">
                    🔔
                    {unreadCount > 0 && (
                      <span className="navbar__notif-badge">{unreadCount}</span>
                    )}
                  </Link>
                  <button
                    className="btn btn-orange"
                    onClick={() => setShowCreate(true)}
                  >
                    Skapa inlägg
                  </button>
                  <div className="navbar__profile">
                    <button
                      className="navbar__avatar"
                      onClick={() => setMenuOpen(!menuOpen)}
                    >
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="Profil" />
                      ) : (
                        <span>{user.email?.charAt(0).toUpperCase()}</span>
                      )}
                    </button>

                    {menuOpen && (
                      <div className="navbar__dropdown">
                        <div className="navbar__dropdown-email">{user.email}</div>
                        <Link to="/profil" className="navbar__dropdown-item" onClick={() => setMenuOpen(false)}>
                          👤 Min profil
                        </Link>
                        <Link to="/mina-tjanster" className="navbar__dropdown-item" onClick={() => setMenuOpen(false)}>
                          📋 Mina tjänster
                        </Link>
                        <Link to="/bestallningar" className="navbar__dropdown-item" onClick={() => setMenuOpen(false)}>
                          📦 Beställningar
                        </Link>
                        <button className="navbar__dropdown-item navbar__dropdown-signout" onClick={handleSignOut}>
                          🚪 Logga ut
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/logga-in" className="navbar__link">Logga in</Link>
                  <Link to="/registrera" className="btn btn-orange">Skapa konto</Link>
                </>
              )}
            </>
          )}
        </div>

      </div>
      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} />
      )}
    </nav>
  )
}

export default Navbar
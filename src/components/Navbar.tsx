import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { useState } from 'react'
import { auth } from '../firebase'
import useAuth from '../hooks/useAuth'
import CreateModal from './CreateModal'
import './Navbar.css'
import logo from '../assets/logo.svg'

function Navbar() {
  const { user, loading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
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

        <div className="navbar__search">
          <span className="navbar__search-icon">🔍</span>
          <input
            type="text"
            placeholder="Vad vill du svippa?"
            className="navbar__search-input"
          />
        </div>

        <div className="navbar__actions">
          {!loading && (
            <>
              {user ? (
                <>
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
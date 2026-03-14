import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { updateProfile } from 'firebase/auth'
import useAuth from '../hooks/useAuth'
import './Profile.css'

function Profile() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [phone, setPhone] = useState('')

useEffect(() => {
  const fetchProfile = async () => {
    if (!user) return
    try {
      const docSnap = await getDoc(doc(db, 'users', user.uid))
      if (docSnap.exists()) {
        const data = docSnap.data()
        setDisplayName(data.name || user.displayName || '')
        setPhone(data.phone || '')
      }
    } catch (err) {
      console.error(err)
    }
  }
  fetchProfile()
}, [user])

  if (loading) return <div className="profile-loading">Laddar...</div>
  if (!user) {
    navigate('/logga-in')
    return null
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setSuccess(false)
    try {
      await updateProfile(user, { displayName })
      await setDoc(doc(db, 'users', user.uid), {
        name: displayName,
        email: user.email,
        phone,
      }, { merge: true })
      setSuccess(true)
      setEditing(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="profile">
      <div className="container profile__inner">

        {/* Header */}
        <div className="profile__header">
          <div className="profile__avatar">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profil" />
            ) : (
              <span>{user.email?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="profile__header-info">
            <h1 className="profile__name">
              {user.displayName || 'Inget namn angivet'}
            </h1>
            <p className="profile__email">{user.email}</p>
            <span className="profile__member">
              Medlem sedan {user.metadata.creationTime
                ? new Date(user.metadata.creationTime).toLocaleDateString('sv-SE', {
                    year: 'numeric',
                    month: 'long',
                  })
                : 'okänt'}
            </span>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => setEditing(!editing)}
          >
            {editing ? 'Avbryt' : '✏️ Redigera profil'}
          </button>
        </div>

        {/* Redigera */}
        {editing && (
          <div className="profile__edit card">
            <h2 className="profile__section-title">Redigera profil</h2>

            <div className="profile__field">
              <label className="profile__label">Visningsnamn</label>
              <input
                className="profile__input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ditt namn"
              />
            </div>

            <div className="profile__field">
              <label className="profile__label">E-post</label>
              <input
                className="profile__input profile__input--disabled"
                value={user.email || ''}
                disabled
              />
              <span className="profile__hint">E-post kan inte ändras här</span>
            </div>

            <div className="profile__field">
              <label className="profile__label">Telefonnummer</label>
              <input
                className="profile__input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="070-000 00 00"
                type="tel"
              />
            </div>

            {success && (
              <div className="profile__success">✅ Profilen uppdaterades!</div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Sparar...' : 'Spara ändringar'}
            </button>
          </div>
        )}

        {/* Sektioner */}
        <div className="profile__sections">

          <div className="profile__section card">
            <h2 className="profile__section-title">Mina tjänster</h2>
            <p className="profile__empty">Du har inga aktiva tjänster ännu.</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/skapa-inlagg')}
            >
              + Skapa tjänst
            </button>
          </div>

          <div className="profile__section card">
            <h2 className="profile__section-title">Mina beställningar</h2>
            <p className="profile__empty">Du har inga beställningar ännu.</p>
          </div>

          <div className="profile__section card">
            <h2 className="profile__section-title">Recensioner</h2>
            <p className="profile__empty">Inga recensioner ännu.</p>
          </div>

        </div>

      </div>
    </div>
  )
}

export default Profile
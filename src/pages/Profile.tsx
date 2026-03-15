import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { updateProfile } from 'firebase/auth'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import useAuth from '../hooks/useAuth'
import type { Timestamp } from 'firebase/firestore'
import './Profile.css'

type Section =
  | 'oversikt'
  | 'mina-tjanster'
  | 'inkomna-bestallningar'
  | 'placerade-bestallningar'
  | 'mina-forfragningar'
  | 'intresseanmalningar'
  | 'recensioner'
  | 'installningar'

type Service = {
  id: string
  title: string
  subcategory: string
  priceType: string
  price: string
  location: string
  createdAt: Timestamp
}

type Order = {
  id: string
  serviceTitle: string
  buyerName: string
  buyerEmail: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Timestamp
}

type PlacedOrder = {
  id: string
  serviceTitle: string
  sellerName: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Timestamp
}

type Request = {
  id: string
  title: string
  subcategory: string
  budget: string
  location: string
  createdAt: Timestamp
}

type Interest = {
  id: string
  requestTitle: string
  svipparName: string
  svipparEmail: string
  message: string
  price: string
  createdAt: Timestamp
}

const NAV_ITEMS = [
  { id: 'oversikt', label: 'Översikt', icon: '🏠', group: null },

  { id: 'mina-tjanster', label: 'Mina tjänster', icon: '🛠️', group: 'Tjänster' },
  { id: 'inkomna-bestallningar', label: 'Inkomna beställningar', icon: '📥', group: 'Tjänster' },

  { id: 'mina-forfragningar', label: 'Mina förfrågningar', icon: '🙋', group: 'Förfrågningar' },
  { id: 'intresseanmalningar', label: 'Intresseanmälningar', icon: '👀', group: 'Förfrågningar' },
  { id: 'placerade-bestallningar', label: 'Placerade beställningar', icon: '📤', group: 'Förfrågningar' },

  { id: 'recensioner', label: 'Recensioner & betyg', icon: '⭐', group: 'Min profil' },
  { id: 'installningar', label: 'Profilinfo & inställningar', icon: '⚙️', group: 'Min profil' },
]

function Profile() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<Section>('oversikt')

  // Profildata
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')

  // Data
  const [services, setServices] = useState<Service[]>([])
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([])
  const [placedOrders, setPlacedOrders] = useState<PlacedOrder[]>([])
  const [myRequests, setMyRequests] = useState<Request[]>([])
  const [interests, setInterests] = useState<Interest[]>([])

  useEffect(() => {
    if (!user) return

    const fetchAll = async () => {
      // Profildata
      const profileSnap = await getDoc(doc(db, 'users', user.uid))
      if (profileSnap.exists()) {
        const data = profileSnap.data()
        setDisplayName(data.name || user.displayName || '')
        setPhone(data.phone || '')
        setBio(data.bio || '')
      }

      // Mina tjänster
      const servicesSnap = await getDocs(query(collection(db, 'services'), where('userId', '==', user.uid)))
      setServices(servicesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Service[])

      // Inkomna beställningar
      const ordersSnap = await getDocs(query(collection(db, 'orders'), where('sellerId', '==', user.uid)))
      setIncomingOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[])

      // Placerade beställningar
      const placedSnap = await getDocs(query(collection(db, 'orders'), where('buyerId', '==', user.uid)))
      setPlacedOrders(placedSnap.docs.map(d => ({ id: d.id, ...d.data() })) as PlacedOrder[])

      // Mina förfrågningar
      const requestsSnap = await getDocs(query(collection(db, 'requests'), where('userId', '==', user.uid)))
      setMyRequests(requestsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Request[])

      // Intresseanmälningar
      const interestsSnap = await getDocs(query(collection(db, 'interests'), where('requestOwnerId', '==', user.uid)))
      setInterests(interestsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Interest[])
    }

    fetchAll()
  }, [user])

  if (loading) return <div className="profile-loading">Laddar...</div>
  if (!user) {
    navigate('/logga-in')
    return null
  }

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)
    try {
      await updateProfile(user, { displayName })
      await setDoc(doc(db, 'users', user.uid), {
        name: displayName,
        email: user.email,
        phone,
        bio,
      }, { merge: true })
      setSuccess(true)
      setEditing(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const pendingOrders = incomingOrders.filter(o => o.status === 'pending')

  return (
    <div className="profile">

      {/* Sidopanel */}
      <aside className="profile__sidebar">

        {/* Användarinfo */}
        <div className="profile__sidebar-user">
          <div className="profile__sidebar-avatar">
            {user.photoURL
              ? <img src={user.photoURL} alt="Profil" />
              : <span>{(displayName || user.email || '?').charAt(0).toUpperCase()}</span>
            }
          </div>
          <div>
            <strong className="profile__sidebar-name">{displayName || 'Inget namn'}</strong>
            <p className="profile__sidebar-email">{user.email}</p>
            <Link
              to={`/svippare/${user.uid}`}
              className="profile__sidebar-publink"
            >
              👁️ Se publik profil →
            </Link>
          </div>
        </div>

        {/* Navigering */}
      <nav className="profile__nav">
        {/* Översikt utan grupp */}
        <button
          className={`profile__nav-item ${activeSection === 'oversikt' ? 'profile__nav-item--active' : ''}`}
          onClick={() => setActiveSection('oversikt')}
        >
          <span className="profile__nav-icon">🏠</span>
          <span>Översikt</span>
        </button>

        {/* Grupperade sektioner */}
        {['Tjänster', 'Förfrågningar', 'Min profil'].map(group => (
          <div key={group} className="profile__nav-group">
            <span className="profile__nav-group-label">{group}</span>
            {NAV_ITEMS.filter(item => item.group === group).map(item => (
              <button
                key={item.id}
                className={`profile__nav-item ${activeSection === item.id ? 'profile__nav-item--active' : ''}`}
                onClick={() => setActiveSection(item.id as Section)}
              >
                <span className="profile__nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.id === 'inkomna-bestallningar' && pendingOrders.length > 0 && (
                  <span className="profile__nav-badge">{pendingOrders.length}</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      </aside>

      {/* Huvudinnehåll */}
      <main className="profile__main">

        {/* ÖVERSIKT */}
        {activeSection === 'oversikt' && (
          <div className="profile__section">
            <h1 className="profile__section-title">Välkommen tillbaka, {displayName || 'där'}! 👋</h1>

            {/* Statistik-kort */}
            <div className="profile__stats">
              <div className="profile__stat-card" onClick={() => setActiveSection('mina-tjanster')}>
                <span className="profile__stat-icon">🛠️</span>
                <strong>{services.length}</strong>
                <span>Aktiva tjänster</span>
              </div>
              <div className="profile__stat-card" onClick={() => setActiveSection('inkomna-bestallningar')}>
                <span className="profile__stat-icon">📥</span>
                <strong>{pendingOrders.length}</strong>
                <span>Nya beställningar</span>
              </div>
              <div className="profile__stat-card" onClick={() => setActiveSection('mina-forfragningar')}>
                <span className="profile__stat-icon">🙋</span>
                <strong>{myRequests.length}</strong>
                <span>Förfrågningar</span>
              </div>
              <div className="profile__stat-card" onClick={() => setActiveSection('intresseanmalningar')}>
                <span className="profile__stat-icon">👀</span>
                <strong>{interests.length}</strong>
                <span>Intresseanmälningar</span>
              </div>
            </div>

            <div className="profile__dashboard">

              {/* Vänster kolumn */}
              <div className="profile__dashboard-left">

                {/* Mina tjänster block */}
                <div className="profile__block card">
                  <div className="profile__block-header">
                    <div className="profile__block-title">
                      <span>🛠️</span>
                      <h2>Mina tjänster</h2>
                    </div>
                    <button className="profile__block-link" onClick={() => setActiveSection('mina-tjanster')}>
                      Se alla →
                    </button>
                  </div>

                  {services.length === 0 ? (
                    <div className="profile__block-empty">
                      <p>Inga aktiva tjänster ännu</p>
                      <button className="btn btn-primary" onClick={() => navigate('/skapa-inlagg')}>
                        + Skapa tjänst
                      </button>
                    </div>
                  ) : (
                    <div className="profile__block-list">
                      {services.slice(0, 3).map(s => (
                        <Link to={`/tjanst/${s.id}`} key={s.id} className="profile__block-item">
                          <div className="profile__block-item-info">
                            <strong>{s.title}</strong>
                            <span>{s.subcategory} · {s.location}</span>
                          </div>
                          <span className="profile__item-tag profile__item-tag--blue">
                            {s.priceType === 'offert' ? 'Offert' : `${s.price} kr`}
                          </span>
                        </Link>
                      ))}
                      <button className="btn btn-primary" onClick={() => navigate('/skapa-inlagg')}>
                        + Ny tjänst
                      </button>
                    </div>
                  )}
                </div>

                {/* Inkomna beställningar block */}
                <div className="profile__block card">
                  <div className="profile__block-header">
                    <div className="profile__block-title">
                      <span>📥</span>
                      <h2>Inkomna beställningar</h2>
                      {pendingOrders.length > 0 && (
                        <span className="profile__nav-badge">{pendingOrders.length}</span>
                      )}
                    </div>
                    <button className="profile__block-link" onClick={() => setActiveSection('inkomna-bestallningar')}>
                      Se alla →
                    </button>
                  </div>

                  {incomingOrders.length === 0 ? (
                    <div className="profile__block-empty">
                      <p>Inga beställningar ännu</p>
                    </div>
                  ) : (
                    <div className="profile__block-list">
                      {incomingOrders.slice(0, 3).map(order => (
                        <div key={order.id} className="profile__block-item">
                          <div className="profile__block-item-info">
                            <strong>{order.buyerName}</strong>
                            <span>{order.serviceTitle}</span>
                          </div>
                          <span className={`profile__item-tag profile__item-tag--${order.status}`}>
                            {order.status === 'pending' ? '⏳ Väntar' : order.status === 'accepted' ? '✅ Godkänd' : '❌ Nekad'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Höger kolumn */}
              <div className="profile__dashboard-right">

                {/* Mina förfrågningar block */}
                <div className="profile__block card">
                  <div className="profile__block-header">
                    <div className="profile__block-title">
                      <span>🙋</span>
                      <h2>Mina förfrågningar</h2>
                    </div>
                    <button className="profile__block-link" onClick={() => setActiveSection('mina-forfragningar')}>
                      Se alla →
                    </button>
                  </div>

                  {myRequests.length === 0 ? (
                    <div className="profile__block-empty">
                      <p>Inga förfrågningar ännu</p>
                      <button className="btn btn-orange" onClick={() => navigate('/skapa-forfragning')}>
                        + Skapa förfrågan
                      </button>
                    </div>
                  ) : (
                    <div className="profile__block-list">
                      {myRequests.slice(0, 3).map(r => (
                        <Link to={`/forfragning/${r.id}`} key={r.id} className="profile__block-item">
                          <div className="profile__block-item-info">
                            <strong>{r.title}</strong>
                            <span>{r.subcategory} · {r.location}</span>
                          </div>
                          <span className="profile__item-tag profile__item-tag--orange">{r.budget} kr</span>
                        </Link>
                      ))}
                      <button className="btn btn-orange" onClick={() => navigate('/skapa-forfragning')}>
                        + Ny förfrågan
                      </button>
                    </div>
                  )}
                </div>

                {/* Intresseanmälningar block */}
                <div className="profile__block card">
                  <div className="profile__block-header">
                    <div className="profile__block-title">
                      <span>👀</span>
                      <h2>Intresseanmälningar</h2>
                    </div>
                    <button className="profile__block-link" onClick={() => setActiveSection('intresseanmalningar')}>
                      Se alla →
                    </button>
                  </div>

                  {interests.length === 0 ? (
                    <div className="profile__block-empty">
                      <p>Inga intresseanmälningar ännu</p>
                    </div>
                  ) : (
                    <div className="profile__block-list">
                      {interests.slice(0, 3).map(interest => (
                        <div key={interest.id} className="profile__block-item">
                          <div className="profile__block-item-info">
                            <strong>{interest.svipparName}</strong>
                            <span>{interest.requestTitle}</span>
                          </div>
                          {interest.price && (
                            <span className="profile__item-tag profile__item-tag--blue">{interest.price} kr</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Snabba åtgärder */}
                <div className="profile__block card">
                  <div className="profile__block-header">
                    <div className="profile__block-title">
                      <span>⚡</span>
                      <h2>Snabba åtgärder</h2>
                    </div>
                  </div>
                  <div className="profile__quick-actions">
                    <button className="profile__quick-btn profile__quick-btn--blue" onClick={() => navigate('/skapa-inlagg')}>
                      <span>🛠️</span>
                      <span>Skapa tjänst</span>
                    </button>
                    <button className="profile__quick-btn profile__quick-btn--orange" onClick={() => navigate('/skapa-forfragning')}>
                      <span>🙋</span>
                      <span>Skapa förfrågan</span>
                    </button>
                    <button className="profile__quick-btn profile__quick-btn--green" onClick={() => navigate('/tjanster')}>
                      <span>🔍</span>
                      <span>Utforska</span>
                    </button>
                    <button className="profile__quick-btn profile__quick-btn--gray" onClick={() => setActiveSection('installningar')}>
                      <span>⚙️</span>
                      <span>Inställningar</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* MINA TJÄNSTER */}
        {activeSection === 'mina-tjanster' && (
          <div className="profile__section">
            <div className="profile__section-header">
              <h1 className="profile__section-title">Mina tjänster</h1>
              <button className="btn btn-primary" onClick={() => navigate('/skapa-inlagg')}>
                + Ny tjänst
              </button>
            </div>

            {services.length === 0 ? (
              <div className="profile__empty">
                <span>🛠️</span>
                <p>Du har inga aktiva tjänster ännu.</p>
                <button className="btn btn-primary" onClick={() => navigate('/skapa-inlagg')}>
                  Skapa din första tjänst
                </button>
              </div>
            ) : (
              <div className="profile__list">
                {services.map(s => (
                  <Link to={`/tjanst/${s.id}`} key={s.id} className="profile__item card">
                    <div className="profile__item-icon">🛠️</div>
                    <div className="profile__item-info">
                      <strong>{s.title}</strong>
                      <span>{s.subcategory} · {s.location}</span>
                    </div>
                    <div className="profile__item-right">
                      <strong>{s.priceType === 'offert' ? 'Offert' : `${s.price} kr`}</strong>
                      <span className="profile__item-tag profile__item-tag--blue">{s.priceType}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INKOMNA BESTÄLLNINGAR */}
        {activeSection === 'inkomna-bestallningar' && (
          <div className="profile__section">
            <h1 className="profile__section-title">Inkomna beställningar</h1>

            {incomingOrders.length === 0 ? (
              <div className="profile__empty">
                <span>📥</span>
                <p>Inga beställningar ännu.</p>
              </div>
            ) : (
              <div className="profile__list">
                {incomingOrders.map(order => (
                  <div key={order.id} className="profile__item card">
                    <div className="profile__item-icon">📥</div>
                    <div className="profile__item-info">
                      <strong>{order.serviceTitle}</strong>
                      <span>Från: {order.buyerName} · {order.buyerEmail}</span>
                      <p className="profile__item-message">{order.message}</p>
                    </div>
                    <span className={`profile__item-tag profile__item-tag--${order.status}`}>
                      {order.status === 'pending' ? '⏳ Väntar' : order.status === 'accepted' ? '✅ Godkänd' : '❌ Nekad'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PLACERADE BESTÄLLNINGAR */}
        {activeSection === 'placerade-bestallningar' && (
          <div className="profile__section">
            <h1 className="profile__section-title">Placerade beställningar</h1>

            {placedOrders.length === 0 ? (
              <div className="profile__empty">
                <span>📤</span>
                <p>Du har inte beställt några tjänster ännu.</p>
                <button className="btn btn-primary" onClick={() => navigate('/tjanster')}>
                  Utforska tjänster
                </button>
              </div>
            ) : (
              <div className="profile__list">
                {placedOrders.map(order => (
                  <div key={order.id} className="profile__item card">
                    <div className="profile__item-icon">📤</div>
                    <div className="profile__item-info">
                      <strong>{order.serviceTitle}</strong>
                      <span>Utförare: {order.sellerName}</span>
                      <p className="profile__item-message">{order.message}</p>
                    </div>
                    <span className={`profile__item-tag profile__item-tag--${order.status}`}>
                      {order.status === 'pending' ? '⏳ Väntar' : order.status === 'accepted' ? '✅ Godkänd' : '❌ Nekad'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MINA FÖRFRÅGNINGAR */}
        {activeSection === 'mina-forfragningar' && (
          <div className="profile__section">
            <div className="profile__section-header">
              <h1 className="profile__section-title">Mina förfrågningar</h1>
              <button className="btn btn-orange" onClick={() => navigate('/skapa-forfragning')}>
                + Ny förfrågan
              </button>
            </div>

            {myRequests.length === 0 ? (
              <div className="profile__empty">
                <span>🙋</span>
                <p>Du har inga förfrågningar ännu.</p>
                <button className="btn btn-orange" onClick={() => navigate('/skapa-forfragning')}>
                  Skapa en förfrågan
                </button>
              </div>
            ) : (
              <div className="profile__list">
                {myRequests.map(r => (
                  <Link to={`/forfragning/${r.id}`} key={r.id} className="profile__item card">
                    <div className="profile__item-icon">🙋</div>
                    <div className="profile__item-info">
                      <strong>{r.title}</strong>
                      <span>{r.subcategory} · {r.location}</span>
                    </div>
                    <div className="profile__item-right">
                      <strong className="profile__item-budget">{r.budget} kr</strong>
                      <span className="profile__item-tag profile__item-tag--orange">Öppen</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INTRESSEANMÄLNINGAR */}
        {activeSection === 'intresseanmalningar' && (
          <div className="profile__section">
            <h1 className="profile__section-title">Intresseanmälningar</h1>

            {interests.length === 0 ? (
              <div className="profile__empty">
                <span>👀</span>
                <p>Inga intresseanmälningar ännu.</p>
              </div>
            ) : (
              <div className="profile__list">
                {interests.map(interest => (
                  <div key={interest.id} className="profile__item card">
                    <div className="profile__item-icon">👀</div>
                    <div className="profile__item-info">
                      <strong>{interest.svipparName}</strong>
                      <span>För: {interest.requestTitle}</span>
                      <p className="profile__item-message">{interest.message}</p>
                    </div>
                    <div className="profile__item-right">
                      {interest.price && <strong>{interest.price} kr</strong>}
                      <a href={`mailto:${interest.svipparEmail}`} className="btn btn-primary">
                        Kontakta
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RECENSIONER */}
        {activeSection === 'recensioner' && (
          <div className="profile__section">
            <h1 className="profile__section-title">Recensioner & betyg</h1>
            <div className="profile__empty">
              <span>⭐</span>
              <p>Inga recensioner ännu.</p>
              <span className="profile__empty-hint">Recensioner visas här när kunder lämnat feedback på dina tjänster.</span>
            </div>
          </div>
        )}

        {/* INSTÄLLNINGAR */}
        {activeSection === 'installningar' && (
          <div className="profile__section">
            <h1 className="profile__section-title">Profilinfo & inställningar</h1>

            <div className="profile__settings card">
              <div className="profile__settings-avatar">
                <div className="profile__avatar-large">
                  {(displayName || user.email || '?').charAt(0).toUpperCase()}
                </div>
                <button className="profile__avatar-change">Byt profilbild</button>
              </div>

              <div className="profile__settings-fields">
                <div className="profile__field">
                  <label className="profile__label">Visningsnamn</label>
                  <input
                    className={`profile__input ${!editing ? 'profile__input--disabled' : ''}`}
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    disabled={!editing}
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
                  <span className="profile__hint">E-post kan inte ändras</span>
                </div>

                <div className="profile__field">
                  <label className="profile__label">Telefonnummer</label>
                  <input
                    className={`profile__input ${!editing ? 'profile__input--disabled' : ''}`}
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    disabled={!editing}
                    placeholder="070-000 00 00"
                    type="tel"
                  />
                </div>

                <div className="profile__field">
                  <label className="profile__label">Om mig</label>
                  <textarea
                    className={`profile__input profile__textarea ${!editing ? 'profile__input--disabled' : ''}`}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    disabled={!editing}
                    placeholder="Beskriv dig själv, din erfarenhet och vad du kan hjälpa med..."
                    rows={4}
                  />
                  <span className="profile__hint">Visas på din publika profilsida</span>
                </div>
              </div>

              {success && (
                <div className="profile__success">✅ Profilen uppdaterades!</div>
              )}

              <div className="profile__settings-actions">
                {editing ? (
                  <>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                      {saving ? 'Sparar...' : 'Spara ändringar'}
                    </button>
                    <button className="btn btn-outline" onClick={() => setEditing(false)}>
                      Avbryt
                    </button>
                  </>
                ) : (
                  <button className="btn btn-outline" onClick={() => setEditing(true)}>
                    ✏️ Redigera profil
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  )
}

export default Profile
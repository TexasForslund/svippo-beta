import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import useAuth from '../hooks/useAuth'
import type { Timestamp } from 'firebase/firestore'
import LoginPromptModal from '../components/LoginPromptModal'
import './RequestDetail.css'

type Request = {
  id: string
  title: string
  description: string
  categoryId: string
  subcategory: string
  budget: string
  location: string
  userName: string
  userEmail: string
  userId: string
  imageBase64: string
  interests: number
  createdAt: Timestamp
}

function RequestDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [request, setRequest] = useState<Request | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInterestForm, setShowInterestForm] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [message, setMessage] = useState('')
  const [price, setPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [userProfile, setUserProfile] = useState<{ name: string, email: string, phone: string } | null>(null)

useEffect(() => {
  const fetchUserProfile = async () => {
    if (!user) return
    try {
      const docSnap = await getDoc(doc(db, 'users', user.uid))
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as { name: string, email: string, phone: string })
      }
    } catch (err) {
      console.error(err)
    }
  }
  fetchUserProfile()
}, [user])

  useEffect(() => {
    const fetchRequest = async () => {
      if (!id) return
      try {
        const docRef = doc(db, 'requests', id)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setRequest({ id: docSnap.id, ...docSnap.data() } as Request)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchRequest()
  }, [id])

  const handleInterest = async () => {
    if (!user || !request || !message) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'interests'), {
        requestId: request.id,
        requestTitle: request.title,
        requestOwnerId: request.userId,
        svipparId: user.uid,
        svipparName: userProfile?.name || user.displayName || user.email,
        svipparEmail: userProfile?.email || user.email,
        svipparPhone: userProfile?.phone || '',
        message,
        price,
        createdAt: serverTimestamp(),
      })
      setSuccess(true)
      setShowInterestForm(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="detail-loading">Laddar...</div>
  if (!request) return (
    <div className="detail-loading">
      <p>Förfrågan hittades inte.</p>
      <Link to="/forfragningar" className="btn btn-orange">Tillbaka till förfrågningar</Link>
    </div>
  )

  const isOwner = user?.uid === request.userId

  return (
    <div className="detail">
      <div className="container detail__inner">

        {/* Brödsmulor */}
        <div className="detail__breadcrumb">
          <Link to="/">Hem</Link>
          <span>·</span>
          <Link to="/forfragningar">Förfrågningar</Link>
          <span>·</span>
          <span>{request.title}</span>
        </div>

        <div className="detail__layout">

          {/* Vänster – huvudinnehåll */}
          <div className="detail__main">

            <div className="detail__badges">
              <span className="detail__badge detail__badge--orange">{request.subcategory}</span>
              <span className="detail__badge detail__badge--location">📍 {request.location}</span>
            </div>

            <h1 className="detail__title">{request.title}</h1>

            {request.imageBase64 && (
              <img
                src={request.imageBase64}
                alt={request.title}
                className="request-detail__image"
              />
            )}

            <div className="detail__section">
              <h2 className="detail__section-title">Om förfrågan</h2>
              <p className="detail__description">{request.description}</p>
            </div>

          </div>

          {/* Höger – sidebar */}
          <div className="detail__sidebar">

            {/* Beställare */}
            <div className="detail__seller card">
              <div className="detail__seller-header">
                <div className="detail__seller-avatar request-detail__avatar">
                  {request.userName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="detail__seller-info">
                  <strong className="detail__seller-name">{request.userName}</strong>
                  <span className="detail__seller-rating">
                    {request.createdAt?.toDate().toLocaleDateString('sv-SE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Budget */}
              <div className="detail__price-box">
                <div className="detail__price-row">
                  <span>Budget</span>
                  <strong className="request-detail__budget">{request.budget} kr</strong>
                </div>
                <div className="detail__price-row">
                  <span>Plats</span>
                  <span>{request.location}</span>
                </div>
              </div>

              {/* Knapp för utförare */}
              {!isOwner && (
                success ? (
                  <div className="request-detail__success">
                    ✅ Din intresseanmälan är skickad!
                  </div>
                ) : (
                  <button
                    className="btn btn-orange detail__order-btn"
                    onClick={() => user ? setShowInterestForm(true) : setShowLoginPrompt(true)}
                  >
                    🙋 Jag kan hjälpa!
                  </button>
                )
              )}

            </div>

            {/* Trygg handel */}
            <div className="detail__safe card">
              <span className="detail__safe-icon">🛡️</span>
              <div>
                <strong>Känn dig trygg med SvippoSafe</strong>
                <p>Vi hjälper till att hantera trassel som kan dyka upp.</p>
              </div>
            </div>

            {/* Ägar-box – visas under SvippoSafe */}
            {isOwner && (
              <div className="request-detail__owner-box">
                <span className="request-detail__owner-icon">📋</span>
                <div>
                  <strong>Detta är din förfrågan</strong>
                  <p>Se vilka Svippare som visat intresse och vill hjälpa dig.</p>
                </div>
                <Link to="/intresseanmalningar" className="btn btn-outline">
                  Se intresseanmälningar
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Intresse-popup */}
      {showInterestForm && (
        <div className="create__overlay" onClick={() => setShowInterestForm(false)}>
          <div className="order-modal" onClick={e => e.stopPropagation()}>

            <div className="order-modal__header">
              <div>
                <h2 className="order-modal__title">Visa intresse</h2>
                <p className="order-modal__subtitle">{request.title}</p>
              </div>
              <button className="order-modal__close" onClick={() => setShowInterestForm(false)}>✕</button>
            </div>

            <div className="order-modal__fields">

              {/* Låsta kontaktuppgifter */}
              <div className="order-modal__field">
                <label className="order-modal__label">Namn</label>
                <input
                  className="order-modal__input order-modal__input--locked"
                  value={userProfile?.name || user?.displayName || ''}
                  disabled
                />
              </div>

              <div className="order-modal__field">
                <label className="order-modal__label">E-post</label>
                <input
                  className="order-modal__input order-modal__input--locked"
                  value={userProfile?.email || user?.email || ''}
                  disabled
                />
              </div>

              <div className="order-modal__field">
                <label className="order-modal__label">Telefonnummer</label>
                <input
                  className="order-modal__input order-modal__input--locked"
                  value={userProfile?.phone || 'Inget telefonnummer angivet'}
                  disabled
                />
              </div>

              <div className="order-modal__field">
                <label className="order-modal__label">Ditt prisförslag (kr)</label>
                <input
                  className="order-modal__input"
                  placeholder="T.ex. 1500"
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                />
              </div>

              <div className="order-modal__field">
                <label className="order-modal__label">Meddelande</label>
                <textarea
                  className="order-modal__textarea"
                  placeholder="Beskriv varför du passar för detta uppdrag..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

            </div>

            <div className="order-modal__actions">
              <button className="btn btn-outline" onClick={() => setShowInterestForm(false)}>
                Avbryt
              </button>
              <button
                className="btn btn-orange"
                onClick={handleInterest}
                disabled={saving || !message}
              >
                {saving ? 'Skickar...' : 'Skicka intresseanmälan'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Login prompt */}
      {showLoginPrompt && (
        <LoginPromptModal
          message="Du måste logga in för att visa intresse för en förfrågan."
          onClose={() => setShowLoginPrompt(false)}
        />
      )}

    </div>
  )
}

export default RequestDetail
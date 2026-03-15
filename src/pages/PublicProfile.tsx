import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { Timestamp } from 'firebase/firestore'
import ReviewsList from '../components/ReviewsList'
import './PublicProfile.css'

type UserProfile = {
  name: string
  email: string
  phone?: string
  bio?: string
  createdAt?: string
}

type Service = {
  id: string
  title: string
  subcategory: string
  priceType: string
  price: string
  location: string
  rating: number
  reviews: number
  createdAt: Timestamp
}

function PublicProfile() {
  const { id } = useParams()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactSent, setContactSent] = useState(false)
  const [activeNav, setActiveNav] = useState('tjanster')

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      try {
        const profileSnap = await getDoc(doc(db, 'users', id))
        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as UserProfile)
        }
        const servicesSnap = await getDocs(
          query(collection(db, 'services'), where('userId', '==', id))
        )
        setServices(servicesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Service[])

        const reviewsSnap = await getDocs(
          query(
            collection(db, 'reviews'),
            where('revieweeId', '==', id),
            where('role', '==', 'buyer')
          )
        )
        const reviewDocs = reviewsSnap.docs.map(d => d.data())
        setReviewCount(reviewDocs.length)
        if (reviewDocs.length > 0) {
          const avg = reviewDocs.reduce((sum, r) => sum + (r.rating as number), 0) / reviewDocs.length
          setAvgRating(Math.round(avg * 10) / 10)
        }

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  // Highlighta aktiv sektion vid scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['tjanster', 'om-mig', 'recensioner', 'kontakt']
      for (const section of sections) {
        const el = document.getElementById(section)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 140 && rect.bottom >= 140) {
            setActiveNav(section)
          }
        }
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId)
    if (el) {
      const offset = 130 // navbar + profilmeny höjd
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  if (loading) return <div className="pubprofile-loading">Laddar profil...</div>
  if (!profile) return (
    <div className="pubprofile-loading">
      <p>Profilen hittades inte.</p>
      <Link to="/" className="btn btn-primary">Till startsidan</Link>
    </div>
  )

  const NAV = [
    { id: 'tjanster', label: 'Mina tjänster' },
    { id: 'om-mig', label: 'Om mig' },
    { id: 'recensioner', label: 'Recensioner' },
    { id: 'kontakt', label: 'Kontakta' },
  ]

  return (
    <div className="pubprofile">

      {/* Profilanpassad meny */}
      <div className="pubprofile__nav">
        <div className="container pubprofile__nav-inner">
          <span className="pubprofile__nav-label">Profil:</span>
          {NAV.map(item => (
            <button
              key={item.id}
              className={`pubprofile__nav-item ${activeNav === item.id ? 'pubprofile__nav-item--active' : ''}`}
              onClick={() => scrollTo(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button
            className="btn btn-outline pubprofile__share-btn"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              alert('Länk kopierad!')
            }}
          >
            🔗 Dela profil
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="pubprofile__hero">
        <div className="container pubprofile__hero-inner">
          <div className="pubprofile__avatar">
            {profile.name?.charAt(0).toUpperCase()}
          </div>
          <div className="pubprofile__hero-info">
            {profile.createdAt && (
              <span className="pubprofile__member">
                Medlem sedan {new Date(profile.createdAt).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' })}
              </span>
            )}
            <h1 className="pubprofile__name">{profile.name}</h1>
            {profile.bio && (
              <p className="pubprofile__bio-short">
                {profile.bio.slice(0, 120)}{profile.bio.length > 120 ? '...' : ''}
              </p>
            )}
            <div className="pubprofile__stats">
              <div className="pubprofile__stat">
                <strong>{services.length}</strong>
                <span>Tjänster</span>
              </div>
              <div className="pubprofile__stat">
                <strong>–</strong>
                <span>Utförda uppdrag</span>
              </div>
              <div className="pubprofile__stat">
                <strong>{reviewCount}</strong>
                <span>Recensioner</span>
              </div>
              <div className="pubprofile__stat">
                <strong>{avgRating !== null ? `⭐ ${avgRating}` : '–'}</strong>
                <span>Snittbetyg</span>
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => scrollTo('kontakt')}
          >
            💬 Kontakta mig
          </button>
        </div>
      </div>

      {/* Långsida med alla sektioner */}
      <div className="container pubprofile__content">

        {/* Mina tjänster */}
        <section id="tjanster" className="pubprofile__section">
          <h2 className="pubprofile__section-title">Mina tjänster</h2>
          {services.length === 0 ? (
            <div className="pubprofile__empty">
              <p>Inga aktiva tjänster just nu.</p>
            </div>
          ) : (
            <div className="pubprofile__services">
              {services.map(s => (
                <Link to={`/tjanst/${s.id}`} key={s.id} className="pubprofile__service card">
                  <div className="pubprofile__service-info">
                    <span className="pubprofile__service-category">{s.subcategory}</span>
                    <h3 className="pubprofile__service-title">{s.title}</h3>
                    <span className="pubprofile__service-location">📍 {s.location}</span>
                  </div>
                  <div className="pubprofile__service-price">
                    <span>{s.priceType === 'offert' ? '' : 'från'}</span>
                    <strong>{s.priceType === 'offert' ? 'Offert' : `${s.price} kr`}</strong>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Om mig */}
        <section id="om-mig" className="pubprofile__section">
          <h2 className="pubprofile__section-title">Om mig</h2>
          <div className="pubprofile__about card">
            {profile.bio ? (
              <p className="pubprofile__about-text">{profile.bio}</p>
            ) : (
              <p className="pubprofile__empty-text">Ingen beskrivning tillagd ännu.</p>
            )}
          </div>
        </section>

        {/* Recensioner */}
        <section id="recensioner" className="pubprofile__section">
          <h2 className="pubprofile__section-title">
            Recensioner
          </h2>
          <ReviewsList userId={id || ''} />
        </section>

        {/* Kontakt */}
        <section id="kontakt" className="pubprofile__section pubprofile__contact-layout">
          <div className="pubprofile__contact-left">
            <h2 className="pubprofile__section-title">Vill du komma i kontakt?</h2>
            <p className="pubprofile__contact-text">
              Fyll i formuläret så återkommer {profile.name} till dig så snart som möjligt.
            </p>
            <div className="pubprofile__contact-info">
              <div className="pubprofile__contact-item">
                <span>📧</span>
                <span>{profile.email}</span>
              </div>
              {profile.phone && (
                <div className="pubprofile__contact-item">
                  <span>📱</span>
                  <span>{profile.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pubprofile__contact-right card">
            {contactSent ? (
              <div className="pubprofile__contact-success">
                <span>🎉</span>
                <strong>Meddelande skickat!</strong>
                <p>{profile.name} återkommer till dig snart.</p>
              </div>
            ) : (
              <div className="pubprofile__contact-form">
                <div className="pubprofile__contact-field">
                  <label>Ditt namn</label>
                  <input
                    className="profile__input"
                    placeholder="För- och efternamn"
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                  />
                </div>
                <div className="pubprofile__contact-field">
                  <label>E-post</label>
                  <input
                    className="profile__input"
                    placeholder="din@email.se"
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                  />
                </div>
                <div className="pubprofile__contact-field">
                  <label>Meddelande</label>
                  <textarea
                    className="profile__input profile__textarea"
                    placeholder="Beskriv vad du behöver hjälp med..."
                    value={contactMessage}
                    onChange={e => setContactMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={!contactName || !contactEmail || !contactMessage}
                  onClick={() => setContactSent(true)}
                >
                  Skicka meddelande
                </button>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}

export default PublicProfile
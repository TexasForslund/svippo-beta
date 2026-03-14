import { useEffect, useState } from 'react'
import OrderModal from '../components/OrderModal'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { Timestamp } from 'firebase/firestore'
import './ServiceDetail.css'

type Service = {
  id: string
  title: string
  description: string
  categoryId: string
  subcategory: string
  priceType: string
  price: string
  location: string
  userName: string
  userEmail: string
  userId: string
  rating: number
  reviews: number
  createdAt: Timestamp
}

function ServiceDetail() {
  const { id } = useParams()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOrder, setShowOrder] = useState(false)

  useEffect(() => {
    const fetchService = async () => {
      if (!id) return
      try {
        const docRef = doc(db, 'services', id)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setService({ id: docSnap.id, ...docSnap.data() } as Service)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchService()
  }, [id])

  if (loading) return <div className="detail-loading">Laddar...</div>
  if (!service) return (
    <div className="detail-loading">
      <p>Tjänsten hittades inte.</p>
      <Link to="/tjanster" className="btn btn-primary">Tillbaka till tjänster</Link>
    </div>
  )

  return (
    <div className="detail">
      <div className="container detail__inner">

        {/* Brödsmulor */}
        <div className="detail__breadcrumb">
          <Link to="/">Hem</Link>
          <span>·</span>
          <Link to="/tjanster">Tjänster</Link>
          <span>·</span>
          <span>{service.title}</span>
        </div>

        <div className="detail__layout">

          {/* Vänster – huvudinnehåll */}
          <div className="detail__main">

            {/* Kategori-badge */}
            <div className="detail__badges">
              <span className="detail__badge">{service.subcategory}</span>
            </div>

            <h1 className="detail__title">{service.title}</h1>

            <div className="detail__section">
              <h2 className="detail__section-title">Om tjänsten</h2>
              <p className="detail__description">{service.description}</p>
            </div>

          </div>

          {/* Höger – utförare & beställning */}
          <div className="detail__sidebar">

            {/* Utförare */}
            <div className="detail__seller card">
              <div className="detail__seller-header">
                <div className="detail__seller-avatar">
                  {service.userName?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="detail__seller-info">
                  <strong className="detail__seller-name">{service.userName}</strong>
                  <span className="detail__seller-rating">
                    ⭐ {service.rating || '–'} ({service.reviews} recensioner)
                  </span>
                </div>
              </div>

              {/* Pris */}
              <div className="detail__price-box">
                <div className="detail__price-row">
                  <span>Pristyp</span>
                  <span className="detail__price-type">{service.priceType}</span>
                </div>
                {service.priceType !== 'offert' && (
                  <div className="detail__price-row">
                    <span>Pris</span>
                    <strong className="detail__price">{service.price} kr</strong>
                  </div>
                )}
                <div className="detail__price-row">
                  <span>Plats</span>
                  <span>{service.location}</span>
                </div>
              </div>

             <button
                className="btn btn-primary detail__order-btn"
                onClick={() => setShowOrder(true)}
                >
                Beställ
                </button>
              <a
                href={`mailto:${service.userEmail}`}
                className="btn btn-outline detail__question-btn"
              >
                💬 Har du en fråga?
              </a>
            </div>

            {/* Trygg handel */}
            <div className="detail__safe card">
              <span className="detail__safe-icon">🛡️</span>
              <div>
                <strong>Känn dig trygg med SvippoSafe</strong>
                <p>Vi hjälper till att hantera trassel som kan dyka upp.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
      {showOrder && (
        <OrderModal
            serviceId={service.id}
            serviceTitle={service.title}
            sellerId={service.userId}
            sellerName={service.userName}
            onClose={() => setShowOrder(false)}
        />
        )}
    </div>
  )
}

export default ServiceDetail
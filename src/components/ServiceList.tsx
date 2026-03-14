import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { Link } from 'react-router-dom'
import type { Timestamp } from 'firebase/firestore'
import './ServiceList.css'

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

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="star-rating">
      ⭐ <strong>{rating || '–'}</strong>
    </span>
  )
}

function ServiceList() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const q = query(collection(db, 'services'), orderBy('createdAt', 'desc'))
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Service[]
        setServices(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  if (loading) return (
    <section className="servicelist">
      <div className="container">
        <div className="servicelist__loading">Laddar tjänster...</div>
      </div>
    </section>
  )

  if (services.length === 0) return (
    <section className="servicelist">
      <div className="container">
        <div className="servicelist__empty">
          <p>Inga tjänster hittades ännu.</p>
          <Link to="/skapa-inlagg" className="btn btn-primary">Skapa första tjänsten</Link>
        </div>
      </div>
    </section>
  )

  return (
    <section className="servicelist">
      <div className="container">
        <div className="servicelist__header">
          <h2 className="servicelist__title">Populärt just nu 🔥</h2>
          <Link to="/tjanster" className="servicelist__see-all">Se alla →</Link>
        </div>

        <div className="servicelist__list">
          {services.map((s) => (
            <Link to={`/tjanst/${s.id}`} key={s.id} className="service-card card">
              <div className="service-card__avatar">
                <div className="service-card__avatar-placeholder">
                  {s.userName?.charAt(0).toUpperCase() || '?'}
                </div>
              </div>

              <div className="service-card__info">
                <div className="service-card__meta">
                  <span className="service-card__name">{s.userName}</span>
                  <StarRating rating={s.rating} />
                  <span className="service-card__reviews">({s.reviews})</span>
                  <span className="service-card__distance">· {s.location}</span>
                </div>
                <p className="service-card__title">{s.title}</p>
                <span className="service-card__category">{s.subcategory}</span>
              </div>

              <div className="service-card__price">
                <span className="service-card__price-type">
                  {s.priceType === 'offert' ? '' : 'från:'}
                </span>
                <strong>
                  {s.priceType === 'offert' ? 'Offert' : `${s.price}kr`}
                </strong>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ServiceList
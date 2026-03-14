import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { Link } from 'react-router-dom'
import type { Timestamp } from 'firebase/firestore'
import './Requests.css'

type Request = {
  id: string
  title: string
  description: string
  subcategory: string
  budget: string
  location: string
  userName: string
  imageBase64: string
  interests: number
  createdAt: Timestamp
}

function Requests() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'))
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Request[]
        setRequests(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchRequests()
  }, [])

  if (loading) return (
    <div className="requests-loading">Laddar förfrågningar...</div>
  )

  return (
    <div className="requests">
      <div className="container requests__inner">

        <div className="requests__header">
          <div>
            <h1 className="requests__title">Förfrågningar</h1>
            <p className="requests__subtitle">Hitta uppdrag som passar dig</p>
          </div>
          <Link to="/skapa-forfragning" className="btn btn-orange">
            + Skapa förfrågan
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="requests__empty">
            <p>Inga förfrågningar ännu.</p>
            <Link to="/skapa-forfragning" className="btn btn-orange">
              Skapa första förfrågan
            </Link>
          </div>
        ) : (
          <div className="requests__list">
            {requests.map(r => (
              <Link to={`/forfragning/${r.id}`} key={r.id} className="request-card card">

                {r.imageBase64 && (
                  <div className="request-card__image">
                    <img src={r.imageBase64} alt={r.title} />
                  </div>
                )}

                <div className="request-card__content">
                  <div className="request-card__meta">
                    <span className="request-card__category">{r.subcategory}</span>
                    <span className="request-card__location">📍 {r.location}</span>
                  </div>

                  <h2 className="request-card__title">{r.title}</h2>
                  <p className="request-card__description">{r.description}</p>

                  <div className="request-card__footer">
                    <div className="request-card__user">
                      <div className="request-card__avatar">
                        {r.userName?.charAt(0).toUpperCase()}
                      </div>
                      <span>{r.userName}</span>
                    </div>
                    <div className="request-card__budget">
                      <span>Budget:</span>
                      <strong>{r.budget} kr</strong>
                    </div>
                  </div>
                </div>

              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default Requests
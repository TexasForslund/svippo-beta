import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import useAuth from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import type { Timestamp } from 'firebase/firestore'
import './Interests.css'

type Interest = {
  id: string
  requestId: string
  requestTitle: string
  svipparName: string
  svipparEmail: string
  message: string
  price: string
  createdAt: Timestamp
}

function Interests() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [interests, setInterests] = useState<Interest[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchInterests = async () => {
      try {
        const q = query(
          collection(db, 'interests'),
          where('requestOwnerId', '==', user.uid)
        )
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Interest[]
        setInterests(data)
      } catch (err) {
        console.error(err)
      } finally {
        setFetching(false)
      }
    }
    fetchInterests()
  }, [user])

  if (loading || fetching) return <div className="interests-loading">Laddar...</div>
  if (!user) {
    navigate('/logga-in')
    return null
  }

  return (
    <div className="interests">
      <div className="container interests__inner">

        <div className="interests__header">
          <h1 className="interests__title">Intresseanmälningar</h1>
          <p className="interests__subtitle">Svippare som vill hjälpa dig</p>
        </div>

        {interests.length === 0 ? (
          <div className="interests__empty">
            <p>Inga intresseanmälningar ännu 👀</p>
            <span>Svippare kommer synas här när de visar intresse.</span>
          </div>
        ) : (
          <div className="interests__list">
            {interests.map(interest => (
              <div key={interest.id} className="interest-card card">

                <div className="interest-card__header">
                  <div className="interest-card__avatar">
                    {interest.svipparName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="interest-card__info">
                    <strong>{interest.svipparName}</strong>
                    <a href={`mailto:${interest.svipparEmail}`}>
                      {interest.svipparEmail}
                    </a>
                  </div>
                  {interest.price && (
                    <div className="interest-card__price">
                      <span>Prisförslag</span>
                      <strong>{interest.price} kr</strong>
                    </div>
                  )}
                </div>

                <div className="interest-card__request">
                  📋 {interest.requestTitle}
                </div>

                <div className="interest-card__message">
                  <p>{interest.message}</p>
                </div>

                
                  href={`mailto:${interest.svipparEmail}`}
                  className="btn btn-primary"
                <a>
                  ✉️ Kontakta {interest.svipparName}
                </a>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default Interests
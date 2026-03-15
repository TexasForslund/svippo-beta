import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import type { Timestamp } from 'firebase/firestore'
import './ReviewsList.css'

type Review = {
  id: string
  reviewerName: string
  rating: number
  comment: string
  serviceTitle: string
  createdAt: Timestamp
}

type Props = {
  userId: string
  role?: 'seller' | 'buyer'
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="reviews__stars">
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={`reviews__star ${star <= rating ? 'reviews__star--active' : ''}`}
        >
          ★
        </span>
      ))}
    </div>
  )
}

function ReviewsList({ userId, role = 'seller' }: Props) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [avgRating, setAvgRating] = useState(0)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const q = query(
          collection(db, 'reviews'),
          where('revieweeId', '==', userId),
          where('role', '==', 'buyer') // recensioner skrivna av köpare = om säljaren
        )
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as Review[]

        // Sortera nyast först
        data.sort((a, b) =>
          b.createdAt?.toDate().getTime() - a.createdAt?.toDate().getTime()
        )

        setReviews(data)

        // Beräkna snittbetyg
        if (data.length > 0) {
          const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length
          setAvgRating(Math.round(avg * 10) / 10)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchReviews()
  }, [userId])

  if (loading) return <div className="reviews__loading">Laddar recensioner...</div>

  if (reviews.length === 0) return (
    <div className="reviews__empty">
      <span>⭐</span>
      <p>Inga recensioner ännu</p>
      <span>Recensioner visas här när kunder lämnat feedback.</span>
    </div>
  )

  return (
    <div className="reviews">

      {/* Snittbetyg */}
      <div className="reviews__summary">
        <span className="reviews__avg">{avgRating}</span>
        <StarDisplay rating={Math.round(avgRating)} />
        <span className="reviews__count">{reviews.length} recensioner</span>
      </div>

      {/* Recensionskort */}
      <div className="reviews__grid">
        {reviews.map(review => (
          <div key={review.id} className="reviews__card card">
            <StarDisplay rating={review.rating} />
            {review.comment && (
              <p className="reviews__comment">"{review.comment}"</p>
            )}
            <div className="reviews__footer">
              <div className="reviews__reviewer">
                <div className="reviews__reviewer-avatar">
                  {review.reviewerName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong>{review.reviewerName}</strong>
                  <span>{review.serviceTitle}</span>
                </div>
              </div>
              <span className="reviews__date">
                {review.createdAt?.toDate().toLocaleDateString('sv-SE', {
                  year: 'numeric',
                  month: 'long',
                })}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export default ReviewsList
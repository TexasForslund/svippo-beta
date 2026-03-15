import { useState } from 'react'
import { collection, addDoc, serverTimestamp, doc, updateDoc, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import useAuth from '../hooks/useAuth'
import './ReviewModal.css'

type Props = {
  orderId: string
  serviceId: string
  serviceTitle: string
  revieweeId: string
  revieweeName: string
  role: 'buyer' | 'seller'
  onClose: () => void
  onSuccess: () => void
}

function ReviewModal({ orderId, serviceId, serviceTitle, revieweeId, revieweeName, role, onClose, onSuccess }: Props) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

    const handleSubmit = async () => {
    if (!user || rating === 0) return
    setSaving(true)
    try {
        // Spara recensionen
        await addDoc(collection(db, 'reviews'), {
        orderId,
        serviceId,
        serviceTitle,
        reviewerId: user.uid,
        reviewerName: user.displayName || user.email,
        revieweeId,
        revieweeName,
        role,
        rating,
        comment,
        createdAt: serverTimestamp(),
        })

        // Markera ordern som recenserad
        await updateDoc(doc(db, 'orders', orderId), {
        [`${role}Reviewed`]: true,
        })

        // Beräkna nytt snittbetyg och uppdatera tjänsten
        if (role === 'buyer' && serviceId) {
        const reviewsSnap = await getDocs(
            query(
            collection(db, 'reviews'),
            where('serviceId', '==', serviceId),
            where('role', '==', 'buyer')
            )
        )
        const allRatings = reviewsSnap.docs.map(d => d.data().rating as number)
        allRatings.push(rating) // lägg till den nya
        const avg = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
        const rounded = Math.round(avg * 10) / 10

        await updateDoc(doc(db, 'services', serviceId), {
            rating: rounded,
            reviews: allRatings.length,
        })
        }

        onSuccess()
    } catch (err) {
        console.error(err)
    } finally {
        setSaving(false)
    }
    }

  return (
    <div className="review-overlay" onClick={onClose}>
      <div className="review-modal" onClick={e => e.stopPropagation()}>

        <div className="review-modal__header">
          <div>
            <h2 className="review-modal__title">Lämna en recension</h2>
            <p className="review-modal__subtitle">
              {role === 'buyer' ? `Hur var din upplevelse med ${revieweeName}?` : `Hur var det att jobba med ${revieweeName}?`}
            </p>
          </div>
          <button className="order-modal__close" onClick={onClose}>✕</button>
        </div>

        {/* Stjärnbetyg */}
        <div className="review-modal__stars">
          <p className="review-modal__stars-label">Betyg</p>
          <div className="review-modal__star-row">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                className={`review-modal__star ${star <= (hoverRating || rating) ? 'review-modal__star--active' : ''}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                type="button"
              >
                ★
              </button>
            ))}
          </div>
          {rating > 0 && (
            <span className="review-modal__rating-label">
              {rating === 1 ? 'Dåligt' : rating === 2 ? 'Okej' : rating === 3 ? 'Bra' : rating === 4 ? 'Mycket bra' : 'Utmärkt!'}
            </span>
          )}
        </div>

        {/* Kommentar */}
        <div className="review-modal__field">
          <label className="review-modal__label">Kommentar (valfritt)</label>
          <textarea
            className="review-modal__textarea"
            placeholder={role === 'buyer' ? `Berätta om din upplevelse med ${revieweeName}...` : `Berätta om hur samarbetet med ${revieweeName} var...`}
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={4}
          />
        </div>

        <div className="order-modal__actions">
          <button className="btn btn-outline" onClick={onClose}>Avbryt</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving || rating === 0}
          >
            {saving ? 'Skickar...' : 'Skicka recension'}
          </button>
        </div>

      </div>
    </div>
  )
}

export default ReviewModal
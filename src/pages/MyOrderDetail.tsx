import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import useAuth from '../hooks/useAuth'
import type { Timestamp } from 'firebase/firestore'
import { orderQuestions } from '../data/orderQuestions'
import ReviewModal from '../components/ReviewModal'
import './MyOrderDetail.css'

type ProjectStatus = 'not_started' | 'in_progress' | 'almost_done' | 'completed'

type Order = {
  id: string
  serviceId: string
  serviceTitle: string
  sellerId: string
  sellerName: string
  buyerId: string
  buyerName: string
  buyerEmail: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  projectStatus?: ProjectStatus
  subcategory?: string
  answers?: { [key: string]: string }
  customAnswers?: { [key: string]: string }
  createdAt: Timestamp
  buyerReviewed?: boolean
}

const STATUS_STEPS = [
  { key: 'not_started', label: 'Ej påbörjat', desc: 'Projektet väntar på att starta', num: 1 },
  { key: 'in_progress', label: 'Pågår', desc: 'Projektet är igång', num: 2 },
  { key: 'almost_done', label: 'Nästan klart', desc: 'Sista finishen återstår', num: 3 },
  { key: 'completed', label: 'Slutfört', desc: 'Projektet är klart! 🎉', num: 4 },
]

function MyOrderDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return
      try {
        const docSnap = await getDoc(doc(db, 'orders', id))
        if (docSnap.exists()) {
          const orderData = { id: docSnap.id, ...docSnap.data() } as Order
          setOrder(orderData)

          // Kolla om användaren redan lämnat en recension
          if (user) {
            const reviewSnap = await getDocs(
              query(
                collection(db, 'reviews'),
                where('orderId', '==', id),
                where('reviewerId', '==', user.uid)
              )
            )
            setAlreadyReviewed(!reviewSnap.empty)
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id, user])

  if (loading) return <div className="myorder-loading">Laddar beställning...</div>
  if (!order) return (
    <div className="myorder-loading">
      <p>Beställningen hittades inte.</p>
      <button className="btn btn-primary" onClick={() => navigate('/profil')}>
        Tillbaka till profil
      </button>
    </div>
  )

  // Omdirigera om användaren inte är köparen
  if (user?.uid !== order.buyerId) {
    navigate('/profil')
    return null
  }

  const projectStatus = order.projectStatus || 'not_started'
  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === projectStatus)

  return (
    <div className="myorder">
      <div className="container myorder__inner">

        {/* Tillbaka */}
        <button className="orderdetail__back" onClick={() => navigate('/profil')}>
          ← Tillbaka till profil
        </button>

        {/* Avslutat-banner */}
        {projectStatus === 'completed' && (
          <div className="orderdetail__completed-banner">
            🎉 Detta projekt är avslutat
          </div>
        )}

        <div className="myorder__layout">

          {/* Vänster – orderinfo */}
          <div className="myorder__main">

            {/* Header */}
            <div className="myorder__header card">
              <div className="myorder__header-top">
                <div>
                  <span className="orderdetail__label">Din beställning av</span>
                  <h1 className="orderdetail__title">{order.serviceTitle}</h1>
                  <span className="orderdetail__date">
                    {order.createdAt?.toDate().toLocaleDateString('sv-SE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <span className={`orderdetail__status orderdetail__status--${order.status}`}>
                  {order.status === 'pending' ? '⏳ Väntar på godkännande' : order.status === 'accepted' ? '✅ Godkänd' : '❌ Nekad'}
                </span>
              </div>
              <Link to={`/tjanst/${order.serviceId}`} className="orderdetail__service-link">
                🔗 Visa tjänsten →
              </Link>
            </div>

            {/* Ditt meddelande */}
            <div className="myorder__message card">
              <h2 className="orderdetail__section-title">📋 Ditt meddelande</h2>
              <div className="orderdetail__field-value orderdetail__field-value--message">
                {order.message}
              </div>
            </div>

            {/* Svar på underkategori-frågor */}
            {order.answers && Object.keys(order.answers).length > 0 && (
              <div className="myorder__message card">
                <h2 className="orderdetail__section-title">📝 Dina svar</h2>
                <div className="orderdetail__answers">
                  {Object.entries(order.answers).map(([key, value]) => {
                    const questions = orderQuestions[order.subcategory || ''] || []
                    const question = questions.find(q => q.id === key)
                    return (
                      <div key={key} className="orderdetail__answer-row">
                        <span className="orderdetail__answer-key">{question?.label || key}</span>
                        <span className="orderdetail__answer-value">{value}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Svar på utförarens egna frågor */}
            {order.customAnswers && Object.keys(order.customAnswers).length > 0 && (
              <div className="myorder__message card">
                <h2 className="orderdetail__section-title">💬 Svar på utförarens frågor</h2>
                <div className="orderdetail__answers">
                  {Object.entries(order.customAnswers).map(([key, value]) => (
                    <div key={key} className="orderdetail__answer-row">
                      <span className="orderdetail__answer-key">{key}</span>
                      <span className="orderdetail__answer-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projektstatus – skrivskyddad vy för köparen */}
            {order.status === 'accepted' && (
              <div className="myorder__progress card">
                <h2 className="orderdetail__section-title">📊 Projektstatus</h2>
                <p className="orderdetail__progress-hint">
                  Följ hur {order.sellerName} arbetar med ditt projekt.
                </p>
                <div className="orderdetail__progress-steps">
                  {STATUS_STEPS.map((step, index) => {
                    const isDone = index < currentStepIndex
                    const isActive = step.key === projectStatus
                    return (
                      <div
                        key={step.key}
                        className={`orderdetail__progress-step myorder__progress-step ${isActive ? 'orderdetail__progress-step--active' : ''} ${isDone ? 'orderdetail__progress-step--done' : ''}`}
                      >
                        <div className="orderdetail__progress-dot">
                          {isDone ? '✓' : step.num}
                        </div>
                        <div className="orderdetail__progress-info">
                          <strong>{step.label}</strong>
                          <span>{step.desc}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Höger – utförarinfo */}
          <div className="myorder__sidebar">

            {/* Utförarinformation */}
            <div className="myorder__seller card">
              <h2 className="orderdetail__section-title">🛠️ Utförare</h2>
              <div className="orderdetail__customer-avatar">
                {order.sellerName?.charAt(0).toUpperCase()}
              </div>
              <strong className="orderdetail__customer-name">{order.sellerName}</strong>
              <Link
                to={`/svippare/${order.sellerId}`}
                className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                👤 Se profil
              </Link>
            </div>

            {/* Lämna recension */}
            {projectStatus === 'completed' && !alreadyReviewed && !reviewSuccess && (
              <div className="orderdetail__review card">
                <h2 className="orderdetail__section-title">⭐ Lämna en recension</h2>
                <p className="orderdetail__progress-hint">
                  Hur var din upplevelse med {order.sellerName}?
                </p>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setShowReviewModal(true)}
                >
                  ⭐ Recensera {order.sellerName}
                </button>
              </div>
            )}

            {(alreadyReviewed || reviewSuccess) && (
              <div className="orderdetail__review card">
                <div className="orderdetail__payment-done">
                  ⭐ Du har lämnat en recension!
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Recensionsmodal */}
      {showReviewModal && (
        <ReviewModal
          orderId={order.id}
          serviceId={order.serviceId}
          serviceTitle={order.serviceTitle}
          revieweeId={order.sellerId}
          revieweeName={order.sellerName}
          role="buyer"
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            setShowReviewModal(false)
            setReviewSuccess(true)
            setAlreadyReviewed(true)
          }}
        />
      )}

    </div>
  )
}

export default MyOrderDetail
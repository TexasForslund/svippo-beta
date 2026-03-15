import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import useAuth from '../hooks/useAuth'
import type { Timestamp } from 'firebase/firestore'
import './OrderDetail.css'

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
  buyerPhone: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  projectStatus?: ProjectStatus
  paymentStatus?: 'unpaid' | 'paid'
  createdAt: Timestamp
}

function OrderDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>('not_started')
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid' | null>(null)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)

  // Hämta order
  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return
      try {
        const docSnap = await getDoc(doc(db, 'orders', id))
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() } as Order)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id])

  // Synka projectStatus
    useEffect(() => {
    if (order?.projectStatus) {
        setProjectStatus(order.projectStatus)
    }
    if (order?.paymentStatus) {
        setPaymentStatus(order.paymentStatus)
    }
    }, [order])

  // Behörighetskontroll
  useEffect(() => {
    if (order && user && user.uid !== order.sellerId) {
      navigate('/profil')
    }
  }, [order, user, navigate])

  const handleStatus = async (status: 'accepted' | 'rejected') => {
    if (!order) return
    setUpdating(true)
    try {
      await updateDoc(doc(db, 'orders', order.id), { status })
      setOrder(prev => prev ? { ...prev, status } : prev)
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(false)
    }
  }

  const handleProjectStatus = async (status: ProjectStatus) => {
    if (!order) return
    setUpdating(true)
    try {
      await updateDoc(doc(db, 'orders', order.id), { projectStatus: status })
      setProjectStatus(status)

      if (status === 'completed') {
        // Notis till beställaren
        await addDoc(collection(db, 'notifications'), {
          userId: order.buyerId,
          type: 'project_completed',
          orderId: order.id,
          serviceTitle: order.serviceTitle,
          sellerName: order.sellerName,
          message: `${order.sellerName} har markerat projektet "${order.serviceTitle}" som slutfört!`,
          read: false,
          createdAt: serverTimestamp(),
        })

        // Notis till utföraren
        await addDoc(collection(db, 'notifications'), {
          userId: order.sellerId,
          type: 'request_review',
          orderId: order.id,
          serviceTitle: order.serviceTitle,
          buyerName: order.buyerName,
          message: `Projektet "${order.serviceTitle}" är slutfört – glöm inte ta betalt och lämna en recension!`,
          read: false,
          createdAt: serverTimestamp(),
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(false)
    }
  }

  const handlePayment = async (status: 'paid' | 'unpaid') => {
    if (!order) return
    setUpdating(true)
    try {
        await updateDoc(doc(db, 'orders', order.id), { paymentStatus: status })
        setPaymentStatus(status)
    } catch (err) {
        console.error(err)
    } finally {
        setUpdating(false)
    }
    }

  if (loading) return <div className="orderdetail-loading">Laddar beställning...</div>
  if (!order) return (
    <div className="orderdetail-loading">
      <p>Beställningen hittades inte.</p>
      <button className="btn btn-primary" onClick={() => navigate('/profil')}>
        Tillbaka till profil
      </button>
    </div>
  )

  return (
    <div className={`orderdetail ${projectStatus === 'completed' ? 'orderdetail--completed' : ''}`}>
      <div className="container orderdetail__inner">

        {/* Tillbaka */}
        <button className="orderdetail__back" onClick={() => navigate('/profil')}>
          ← Tillbaka till profil
        </button>

        {projectStatus === 'completed' && (
            <div className="orderdetail__completed-banner">
                🎉 Detta projekt är avslutat
            </div>
        )}

        <div className="orderdetail__layout">

          {/* Vänster – beställningsinfo */}
          <div className="orderdetail__main">

            {/* Header */}
            <div className="orderdetail__header card">
              <div className="orderdetail__header-top">
                <div>
                  <span className="orderdetail__label">Beställning av</span>
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
                  {order.status === 'pending' ? '⏳ Väntar' : order.status === 'accepted' ? '✅ Godkänd' : '❌ Nekad'}
                </span>
              </div>
              <Link to={`/tjanst/${order.serviceId}`} className="orderdetail__service-link">
                🔗 Visa tjänsten →
              </Link>
            </div>

            {/* Beställarens formulär */}
            <div className="orderdetail__form card">
              <h2 className="orderdetail__section-title">📋 Ifyllt formulär</h2>
              <div className="orderdetail__field">
                <span className="orderdetail__field-label">Meddelande</span>
                <div className="orderdetail__field-value orderdetail__field-value--message">
                  {order.message}
                </div>
              </div>
            </div>

          </div>

          {/* Höger – kund & åtgärder */}
          <div className="orderdetail__sidebar">

            {/* Kundinformation */}
            <div className="orderdetail__customer card">
              <h2 className="orderdetail__section-title">👤 Kundinformation</h2>
              <div className="orderdetail__customer-avatar">
                {order.buyerName?.charAt(0).toUpperCase()}
              </div>
              <strong className="orderdetail__customer-name">{order.buyerName}</strong>
              <div className="orderdetail__customer-details">
                <div className="orderdetail__detail-row">
                  <span>📧</span>
                  <a href={`mailto:${order.buyerEmail}`}>{order.buyerEmail}</a>
                </div>
                {order.buyerPhone && (
                  <div className="orderdetail__detail-row">
                    <span>📱</span>
                    <a href={`tel:${order.buyerPhone}`}>{order.buyerPhone}</a>
                  </div>
                )}
              </div>
              <div className="orderdetail__contact-actions">
                <a href={`mailto:${order.buyerEmail}`} className="btn btn-primary">
                  ✉️ Skicka e-post
                </a>
                {order.buyerPhone && (
                  <a href={`tel:${order.buyerPhone}`} className="btn btn-outline">
                    📱 Ring kunden
                  </a>
                )}
              </div>
            </div>

            {/* Status & åtgärder */}
            <div className="orderdetail__actions card">
              <h2 className="orderdetail__section-title">⚡ Hantera beställning</h2>
              <div className={`orderdetail__current-status orderdetail__status--${order.status}`}>
                {order.status === 'pending' ? '⏳ Väntar på ditt svar' : order.status === 'accepted' ? '✅ Du har godkänt denna beställning' : '❌ Du har nekat denna beställning'}
              </div>
              {order.status === 'pending' && (
                <div className="orderdetail__action-btns">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleStatus('accepted')}
                    disabled={updating}
                  >
                    ✅ Godkänn beställning
                  </button>
                  <button
                    className="btn btn-outline orderdetail__reject-btn"
                    onClick={() => handleStatus('rejected')}
                    disabled={updating}
                  >
                    ❌ Neka beställning
                  </button>
                </div>
              )}
              {order.status === 'rejected' && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleStatus('accepted')}
                  disabled={updating}
                >
                  Ångra – Godkänn beställning
                </button>
              )}
            </div>

            {/* Projektstatus */}
            {order.status === 'accepted' && (
              <div className="orderdetail__progress card">
                <h2 className="orderdetail__section-title">📊 Projektstatus</h2>
                <p className="orderdetail__progress-hint">
                  Uppdatera hur långt projektet kommit – beställaren ser detta i realtid.
                </p>
                <div className="orderdetail__progress-steps">

                  <button
                    className={`orderdetail__progress-step ${projectStatus === 'not_started' ? 'orderdetail__progress-step--active' : ''} ${['in_progress', 'almost_done', 'completed'].includes(projectStatus) ? 'orderdetail__progress-step--done' : ''}`}
                    onClick={() => handleProjectStatus('not_started')}
                    disabled={updating || projectStatus === 'completed'}
                  >
                    <div className="orderdetail__progress-dot">
                      {['in_progress', 'almost_done', 'completed'].includes(projectStatus) ? '✓' : '1'}
                    </div>
                    <div className="orderdetail__progress-info">
                      <strong>Ej påbörjat</strong>
                      <span>Projektet väntar på att starta</span>
                    </div>
                  </button>

                  <button
                    className={`orderdetail__progress-step ${projectStatus === 'in_progress' ? 'orderdetail__progress-step--active' : ''} ${['almost_done', 'completed'].includes(projectStatus) ? 'orderdetail__progress-step--done' : ''}`}
                    onClick={() => handleProjectStatus('in_progress')}
                    disabled={updating || projectStatus === 'completed'}
                  >
                    <div className="orderdetail__progress-dot">
                      {['almost_done', 'completed'].includes(projectStatus) ? '✓' : '2'}
                    </div>
                    <div className="orderdetail__progress-info">
                      <strong>Pågår</strong>
                      <span>Projektet är igång</span>
                    </div>
                  </button>

                  <button
                    className={`orderdetail__progress-step ${projectStatus === 'almost_done' ? 'orderdetail__progress-step--active' : ''} ${['completed'].includes(projectStatus) ? 'orderdetail__progress-step--done' : ''}`}
                    onClick={() => handleProjectStatus('almost_done')}
                    disabled={updating || projectStatus === 'completed'}
                  >
                    <div className="orderdetail__progress-dot">
                      {['completed'].includes(projectStatus) ? '✓' : '3'}
                    </div>
                    <div className="orderdetail__progress-info">
                      <strong>Nästan klart</strong>
                      <span>Sista finishen återstår</span>
                    </div>
                  </button>

                  <button
                    className={`orderdetail__progress-step ${projectStatus === 'completed' ? 'orderdetail__progress-step--active orderdetail__progress-step--completed' : ''}`}
                    onClick={() => projectStatus !== 'completed' ? setShowCompleteConfirm(true) : null}
                    disabled={updating}
                  >
                    <div className="orderdetail__progress-dot">
                      {projectStatus === 'completed' ? '✓' : '4'}
                    </div>
                    <div className="orderdetail__progress-info">
                      <strong>Slutfört</strong>
                      <span>Projektet är klart! 🎉</span>
                    </div>
                  </button>

                </div>
              </div>
            )}

            {/* Betalning – visas när projektet är slutfört */}
            {projectStatus === 'completed' && (
            <div className="orderdetail__payment card">
                <h2 className="orderdetail__section-title">💰 Betalning</h2>
                <p className="orderdetail__progress-hint">
                Har du tagit betalt av {order.buyerName}?
                </p>

                {paymentStatus === 'paid' ? (
                <div className="orderdetail__payment-done">
                    ✅ Du har markerat betalningen som mottagen!
                </div>
                ) : (
                <div className="orderdetail__payment-btns">
                    <button
                    className="btn btn-primary"
                    onClick={() => handlePayment('paid')}
                    disabled={updating}
                    >
                    ✅ Ja, jag har fått betalt
                    </button>
                    <button
                    className="btn btn-outline"
                    onClick={() => handlePayment('unpaid')}
                    disabled={updating}
                    >
                    ⏳ Inte än
                    </button>
                </div>
                )}
            </div>
            )}

          </div>
        </div>
      </div>

      {/* Bekräftelsepopup */}
      {showCompleteConfirm && (
        <div className="create__overlay" onClick={() => setShowCompleteConfirm(false)}>
          <div className="order-modal" onClick={e => e.stopPropagation()}>

            <div className="order-modal__header">
              <div>
                <h2 className="order-modal__title">Är du säker? 🎉</h2>
                <p className="order-modal__subtitle">
                  Detta går inte att ångra. Projektet markeras som slutfört och beställaren meddelas.
                </p>
              </div>
              <button className="order-modal__close" onClick={() => setShowCompleteConfirm(false)}>✕</button>
            </div>

            <div className="orderdetail__confirm-content">
              <div className="orderdetail__confirm-checklist">
                <div className="orderdetail__confirm-item">✅ Beställaren meddelas att projektet är klart</div>
                <div className="orderdetail__confirm-item">⭐ Båda parter får möjlighet att lämna recensioner</div>
                <div className="orderdetail__confirm-item">💰 Du påminns om att ta betalt</div>
                <div className="orderdetail__confirm-item">🔒 Projektstatus låses och kan inte ändras</div>
              </div>
            </div>

            <div className="order-modal__actions">
              <button
                className="btn btn-outline"
                onClick={() => setShowCompleteConfirm(false)}
              >
                Avbryt
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  await handleProjectStatus('completed')
                  setShowCompleteConfirm(false)
                }}
                disabled={updating}
              >
                {updating ? 'Slutför...' : '🎉 Ja, projektet är klart!'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default OrderDetail
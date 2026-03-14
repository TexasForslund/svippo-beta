import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import useAuth from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import type { Timestamp } from 'firebase/firestore'
import './Orders.css'

type Order = {
  id: string
  serviceId: string
  serviceTitle: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: Timestamp
}

function Orders() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [fetching, setFetching] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'rejected'>('pending')

  useEffect(() => {
    if (!user) return
    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('sellerId', '==', user.uid)
        )
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[]
        setOrders(data)
      } catch (err) {
        console.error(err)
      } finally {
        setFetching(false)
      }
    }
    fetchOrders()
  }, [user])

  if (loading || fetching) return <div className="orders-loading">Laddar...</div>
  if (!user) {
    navigate('/logga-in')
    return null
  }

  const handleStatus = async (orderId: string, status: 'accepted' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status })
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status } : o)
      )
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = orders.filter(o => o.status === activeTab)

  const countByStatus = (status: string) => orders.filter(o => o.status === status).length

  return (
    <div className="orders">
      <div className="container orders__inner">

        <div className="orders__header">
          <h1 className="orders__title">Beställningar</h1>
          <p className="orders__subtitle">Hantera dina inkomna beställningar</p>
        </div>

        {/* Tabbar */}
        <div className="orders__tabs">
          <button
            className={`orders__tab ${activeTab === 'pending' ? 'orders__tab--active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Väntar
            {countByStatus('pending') > 0 && (
              <span className="orders__tab-badge">{countByStatus('pending')}</span>
            )}
          </button>
          <button
            className={`orders__tab ${activeTab === 'accepted' ? 'orders__tab--active' : ''}`}
            onClick={() => setActiveTab('accepted')}
          >
            Godkända
            {countByStatus('accepted') > 0 && (
              <span className="orders__tab-badge orders__tab-badge--green">{countByStatus('accepted')}</span>
            )}
          </button>
          <button
            className={`orders__tab ${activeTab === 'rejected' ? 'orders__tab--active' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            Nekade
            {countByStatus('rejected') > 0 && (
              <span className="orders__tab-badge orders__tab-badge--red">{countByStatus('rejected')}</span>
            )}
          </button>
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className="orders__empty">
            <p>Inga {activeTab === 'pending' ? 'väntande' : activeTab === 'accepted' ? 'godkända' : 'nekade'} beställningar.</p>
          </div>
        ) : (
          <div className="orders__list">
            {filtered.map(order => (
              <div key={order.id} className="order-card card">

                <div className="order-card__header">
                  <div>
                    <h3 className="order-card__service">{order.serviceTitle}</h3>
                    <p className="order-card__date">
                      {order.createdAt?.toDate().toLocaleDateString('sv-SE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className={`order-card__status order-card__status--${order.status}`}>
                    {order.status === 'pending' ? '⏳ Väntar' : order.status === 'accepted' ? '✅ Godkänd' : '❌ Nekad'}
                  </span>
                </div>

                <div className="order-card__buyer">
                  <div className="order-card__buyer-avatar">
                    {order.buyerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong>{order.buyerName}</strong>
                    <div className="order-card__buyer-contact">
                      <a href={`mailto:${order.buyerEmail}`}>{order.buyerEmail}</a>
                      {order.buyerPhone && <span>· {order.buyerPhone}</span>}
                    </div>
                  </div>
                </div>

                <div className="order-card__message">
                  <p>{order.message}</p>
                </div>

                {order.status === 'pending' && (
                  <div className="order-card__actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleStatus(order.id, 'accepted')}
                    >
                      ✅ Godkänn
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => handleStatus(order.id, 'rejected')}
                    >
                      ❌ Neka
                    </button>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default Orders
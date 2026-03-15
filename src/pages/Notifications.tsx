import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import useAuth from '../hooks/useAuth'
import { Link, useNavigate } from 'react-router-dom'
import type { Timestamp } from 'firebase/firestore'
import './Notifications.css'

type Notification = {
  id: string
  type: string
  orderId: string
  serviceTitle: string
  message: string
  read: boolean
  createdAt: Timestamp
}

function Notifications() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [fetching, setFetching] = useState(true)
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread')

  useEffect(() => {
    if (!user) return
    const fetchNotifications = async () => {
      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid)
        )
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as Notification[]
        // Sortera nyast först
        data.sort((a, b) => b.createdAt?.toDate().getTime() - a.createdAt?.toDate().getTime())
        setNotifications(data)
      } catch (err) {
        console.error(err)
      } finally {
        setFetching(false)
      }
    }
    fetchNotifications()
  }, [user])

  if (loading || fetching) return <div className="notifications-loading">Laddar...</div>
  if (!user) {
    navigate('/logga-in')
    return null
  }

  const handleMarkRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true })
      setNotifications(prev =>
        prev.map(n => n.id === notifId ? { ...n, read: true } : n)
      )
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read)
      await Promise.all(
        unread.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true }))
      )
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error(err)
    }
  }

  const filtered = notifications.filter(n => activeTab === 'unread' ? !n.read : n.read)
  const unreadCount = notifications.filter(n => !n.read).length

  const getIcon = (type: string) => {
    if (type === 'project_completed') return '🎉'
    if (type === 'request_review') return '💰'
    return '🔔'
  }

  const getActionBtn = (notif: Notification) => {
    if (notif.type === 'project_completed') {
      return (
        <Link
          to={`/min-bestallning/${notif.orderId}`}  // ← ändra här
          className="btn btn-primary notifications__action-btn"
          onClick={() => handleMarkRead(notif.id)}
        >
          Lämna recension
        </Link>
      )
    }
    if (notif.type === 'request_review') {
      return (
        <Link
          to={`/bestallning/${notif.orderId}`}
          className="btn btn-orange notifications__action-btn"
          onClick={() => handleMarkRead(notif.id)}
        >
          Ta betalt
        </Link>
      )
    }
    return null
  }

  return (
    <div className="notifications">
      <div className="container notifications__inner">

        <div className="notifications__header">
          <div>
            <h1 className="notifications__title">Notifikationer</h1>
            <p className="notifications__subtitle">
              {unreadCount > 0 ? `${unreadCount} olästa notifikationer` : 'Inga olästa notifikationer'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-outline" onClick={handleMarkAllRead}>
              ✓ Markera alla som lästa
            </button>
          )}
        </div>

        {/* Tabbar */}
        <div className="notifications__tabs">
          <button
            className={`orders__tab ${activeTab === 'unread' ? 'orders__tab--active' : ''}`}
            onClick={() => setActiveTab('unread')}
          >
            Olästa
            {unreadCount > 0 && (
              <span className="orders__tab-badge">{unreadCount}</span>
            )}
          </button>
          <button
            className={`orders__tab ${activeTab === 'read' ? 'orders__tab--active' : ''}`}
            onClick={() => setActiveTab('read')}
          >
            Lästa
          </button>
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className="notifications__empty">
            <span>{activeTab === 'unread' ? '🎉' : '📭'}</span>
            <p>{activeTab === 'unread' ? 'Inga olästa notifikationer!' : 'Inga lästa notifikationer.'}</p>
          </div>
        ) : (
          <div className="notifications__list">
            {filtered.map(notif => (
              <div key={notif.id} className={`notifications__item card ${!notif.read ? 'notifications__item--unread' : ''}`}>
                <span className="notifications__icon">{getIcon(notif.type)}</span>
                <div className="notifications__content">
                  <p className="notifications__message">{notif.message}</p>
                  <span className="notifications__date">
                    {notif.createdAt?.toDate().toLocaleDateString('sv-SE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="notifications__actions">
                  {getActionBtn(notif)}
                  {!notif.read && (
                    <button
                      className="notifications__dismiss"
                      onClick={() => handleMarkRead(notif.id)}
                      title="Markera som läst"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default Notifications
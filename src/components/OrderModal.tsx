import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import useAuth from '../hooks/useAuth'
import './OrderModal.css'

type Props = {
  serviceId: string
  serviceTitle: string
  sellerId: string
  sellerName: string
  onClose: () => void
}

type FormData = {
  name: string
  email: string
  phone: string
  message: string
}

function OrderModal({ serviceId, serviceTitle, sellerId, sellerName, onClose }: Props) {
  const { user } = useAuth()
  const [form, setForm] = useState<FormData>({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    message: '',
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const update = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'orders'), {
        serviceId,
        serviceTitle,
        sellerId,
        sellerName,
        buyerId: user?.uid || null,
        buyerName: form.name,
        buyerEmail: form.email,
        buyerPhone: form.phone,
        message: form.message,
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      setSuccess(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="order-overlay" onClick={onClose}>
      <div className="order-modal" onClick={e => e.stopPropagation()}>

        {!success ? (
          <>
            <div className="order-modal__header">
              <div>
                <h2 className="order-modal__title">Beställ tjänst</h2>
                <p className="order-modal__subtitle">{serviceTitle}</p>
              </div>
              <button className="order-modal__close" onClick={onClose}>✕</button>
            </div>

            <div className="order-modal__fields">
              <div className="order-modal__field">
                <label className="order-modal__label">Ditt namn</label>
                <input
                  className="order-modal__input"
                  placeholder="För- och efternamn"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                />
              </div>

              <div className="order-modal__field">
                <label className="order-modal__label">E-post</label>
                <input
                  className="order-modal__input"
                  placeholder="din@email.se"
                  type="email"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                />
              </div>

              <div className="order-modal__field">
                <label className="order-modal__label">Telefonnummer</label>
                <input
                  className="order-modal__input"
                  placeholder="070-000 00 00"
                  type="tel"
                  value={form.phone}
                  onChange={e => update('phone', e.target.value)}
                />
              </div>

              <div className="order-modal__field">
                <label className="order-modal__label">Meddelande till {sellerName}</label>
                <textarea
                  className="order-modal__textarea"
                  placeholder="Beskriv vad du behöver hjälp med, när och var..."
                  value={form.message}
                  onChange={e => update('message', e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <div className="order-modal__actions">
              <button className="btn btn-outline" onClick={onClose}>Avbryt</button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={saving || !form.name || !form.email || !form.message}
              >
                {saving ? 'Skickar...' : 'Skicka beställning'}
              </button>
            </div>
          </>
        ) : (
          <div className="order-modal__success">
            <div className="order-modal__success-emoji">🎉</div>
            <h2 className="order-modal__success-title">Beställning skickad!</h2>
            <p className="order-modal__success-text">
              {sellerName} har fått din beställning och återkommer till dig så snart som möjligt.
            </p>
            <button className="btn btn-primary" onClick={onClose}>
              Stäng
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default OrderModal
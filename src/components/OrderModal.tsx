import { useState, useEffect } from 'react'
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import useAuth from '../hooks/useAuth'
import { orderQuestions } from '../data/orderQuestions'
import './OrderModal.css'

type Props = {
  serviceId: string
  serviceTitle: string
  sellerId: string
  sellerName: string
  subcategory: string
  priceType: string
  price: string
  location: string
  onClose: () => void
}

function OrderModal({
  serviceId,
  serviceTitle,
  sellerId,
  sellerName,
  subcategory,
  priceType,
  price,
  location,
  onClose,
}: Props) {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Kontaktinfo
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // Anpassade svar
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})

  // Meddelande
  const [message, setMessage] = useState('')

  // Hämta användarens profil
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          const data = snap.data()
          setName(data.name || user.displayName || '')
          setEmail(data.email || user.email || '')
          setPhone(data.phone || '')
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchProfile()
  }, [user])

  const questions = orderQuestions[subcategory] || []
  const totalSteps = questions.length > 0 ? 3 : 2
  const STEPS = questions.length > 0
    ? ['Kontaktinfo', 'Frågor', 'Bekräfta']
    : ['Kontaktinfo', 'Bekräfta']

  const handleSubmit = async () => {
    if (!user) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'orders'), {
        serviceId,
        serviceTitle,
        sellerId,
        sellerName,
        buyerId: user.uid,
        buyerName: name,
        buyerEmail: email,
        buyerPhone: phone,
        message,
        answers,
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

  const canProceed = () => {
    if (step === 0) return name && email
    if (step === 1 && questions.length > 0) {
      const required = questions.filter(q => q.required)
      return required.every(q => answers[q.id])
    }
    return true
  }

  return (
    <div className="order-overlay" onClick={onClose}>
      <div className="order-modal order-modal--large" onClick={e => e.stopPropagation()}>

        {!success ? (
          <>
            {/* Header */}
            <div className="order-modal__header">
              <div>
                <h2 className="order-modal__title">Beställ tjänst</h2>
                <p className="order-modal__subtitle">{serviceTitle}</p>
              </div>
              <button className="order-modal__close" onClick={onClose}>✕</button>
            </div>

            {/* Steg-indikator */}
            <div className="order-modal__steps">
              {STEPS.map((s, i) => (
                <div key={s} className={`order-modal__step ${i === step ? 'order-modal__step--active' : ''} ${i < step ? 'order-modal__step--done' : ''}`}>
                  <div className="order-modal__step-dot">
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span>{s}</span>
                </div>
              ))}
            </div>

            {/* Steg 1 – Kontaktinfo */}
            {step === 0 && (
              <div className="order-modal__fields">
                <p className="order-modal__step-hint">
                  Dina uppgifter är hämtade från din profil.
                </p>

                <div className="order-modal__field">
                  <label className="order-modal__label">Namn</label>
                  <input
                    className="order-modal__input order-modal__input--locked"
                    value={name}
                    disabled
                  />
                </div>

                <div className="order-modal__field">
                  <label className="order-modal__label">E-post</label>
                  <input
                    className="order-modal__input order-modal__input--locked"
                    value={email}
                    disabled
                  />
                </div>

                <div className="order-modal__field">
                  <label className="order-modal__label">Telefon</label>
                  <input
                    className="order-modal__input order-modal__input--locked"
                    value={phone || 'Inget telefonnummer angivet'}
                    disabled
                  />
                </div>
              </div>
            )}

            {/* Steg 2 – Anpassade frågor */}
            {step === 1 && questions.length > 0 && (
              <div className="order-modal__fields">
                <p className="order-modal__step-hint">
                  Besvara frågorna så utföraren kan förbereda sig.
                </p>

                {questions.map(q => (
                  <div key={q.id} className="order-modal__field">
                    <label className="order-modal__label">
                      {q.label} {q.required && <span className="order-modal__required">*</span>}
                    </label>

                    {q.type === 'select' ? (
                      <select
                        className="order-modal__input order-modal__select"
                        value={answers[q.id] || ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      >
                        <option value="">Välj...</option>
                        {q.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : q.type === 'textarea' ? (
                      <textarea
                        className="order-modal__textarea"
                        placeholder={q.placeholder}
                        value={answers[q.id] || ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        rows={3}
                      />
                    ) : (
                      <input
                        className="order-modal__input"
                        type={q.type}
                        placeholder={q.placeholder}
                        value={answers[q.id] || ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Sista steg – Bekräfta */}
            {step === totalSteps - 1 && (
              <div className="order-modal__fields">

                {/* Tjänsteinfo */}
                <div className="order-modal__service-summary">
                  <div className="order-modal__summary-row">
                    <span>Tjänst</span>
                    <strong>{serviceTitle}</strong>
                  </div>
                  <div className="order-modal__summary-row">
                    <span>Utförare</span>
                    <strong>{sellerName}</strong>
                  </div>
                  <div className="order-modal__summary-row">
                    <span>Pris</span>
                    <strong>{priceType === 'offert' ? 'Offert' : `${price} kr (${priceType})`}</strong>
                  </div>
                  <div className="order-modal__summary-row">
                    <span>Plats</span>
                    <strong>{location}</strong>
                  </div>
                </div>

                <div className="order-modal__field">
                  <label className="order-modal__label">Meddelande till {sellerName}</label>
                  <textarea
                    className="order-modal__textarea"
                    placeholder="Beskriv vad du behöver hjälp med, när och eventuella önskemål..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Navigering */}
            <div className="order-modal__nav">
              {step > 0 && (
                <button className="btn btn-outline" onClick={() => setStep(step - 1)}>
                  ← Tillbaka
                </button>
              )}
              {step < totalSteps - 1 ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                >
                  Nästa →
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={saving || !message}
                >
                  {saving ? 'Skickar...' : '🚀 Skicka beställning'}
                </button>
              )}
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
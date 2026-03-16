import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import useAuth from '../hooks/useAuth'
import { categories } from '../data/categories'
import './CreateService.css'


type PriceType = 'timpris' | 'fastpris' | 'offert'

type CustomQuestion = {
  id: string
  label: string
  type: 'text' | 'select' | 'textarea'
  options?: string[]
  required: boolean
}


type FormData = {
  title: string
  description: string
  categoryId: string
  subcategory: string
  priceType: PriceType
  price: string
  location: string
  contactEmail: string
  customQuestions: CustomQuestion[]
}

const STEPS = ['Kategori', 'Detaljer', 'Pris & plats', 'Egna frågor', 'Granska']

function CreateService() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [newQuestion, setNewQuestion] = useState({
    label: '',
    type: 'text' as 'text' | 'select' | 'textarea',
    options: '',
    required: false,
  })
  

const [form, setForm] = useState<FormData>({
  title: '',
  description: '',
  categoryId: '',
  subcategory: '',
  priceType: 'timpris',
  price: '',
  location: '',
  contactEmail: user?.email || '',
  customQuestions: [],
})

  if (loading) return <div className="create-loading">Laddar...</div>
  if (!user) {
    navigate('/logga-in')
    return null
  }

  const selectedCategory = categories.find(c => c.id === form.categoryId)

  const update = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const cleanedQuestions = form.customQuestions.map(q => ({
        id: q.id,
        label: q.label,
        type: q.type,
        required: q.required,
        ...(q.options ? { options: q.options } : {}),
      }))

      await addDoc(collection(db, 'services'), {
        ...form,
        customQuestions: cleanedQuestions,
        userId: user.uid,
        userName: user.displayName || user.email,
        userEmail: user.email,
        rating: 0,
        reviews: 0,
        createdAt: serverTimestamp(),
      })
      setShowSuccess(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="create">
      <div className="container create__inner">

        {/* Steg-indikator */}
        <div className="create__steps">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`create__step ${i === step ? 'create__step--active' : ''} ${i < step ? 'create__step--done' : ''}`}
            >
              <div className="create__step-dot">{i < step ? '✓' : i + 1}</div>
              <span className="create__step-label">{s}</span>
            </div>
          ))}
        </div>

        <div className="create__card card">

          {/* Steg 1 – Kategori */}
          {step === 0 && (
            <div className="create__content">
              <h1 className="create__title">Välj kategori</h1>
              <p className="create__subtitle">Inom vilket område erbjuder du din tjänst?</p>

              <div className="create__categories">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`create__category-btn ${form.categoryId === cat.id ? 'create__category-btn--active' : ''}`}
                    onClick={() => update('categoryId', cat.id)}
                    type="button"
                  >
                    <span className="create__category-icon">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {selectedCategory && (
                <div className="create__subcategories">
                  <label className="create__label">Underkategori</label>
                  <div className="create__subcategory-grid">
                    {selectedCategory.subcategories.map(sub => (
                      <button
                        key={sub}
                        className={`create__subcategory-btn ${form.subcategory === sub ? 'create__subcategory-btn--active' : ''}`}
                        onClick={() => update('subcategory', sub)}
                        type="button"
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Steg 2 – Detaljer */}
          {step === 1 && (
            <div className="create__content">
              <h1 className="create__title">Beskriv din tjänst</h1>
              <p className="create__subtitle">Ju mer detaljer, desto fler beställningar!</p>

              <div className="create__fields">
                <div className="create__field">
                  <label className="create__label">Tjänstens namn</label>
                  <input
                    className="create__input"
                    placeholder="T.ex. Professionell fönsterputsning"
                    value={form.title}
                    onChange={e => update('title', e.target.value)}
                  />
                </div>

                <div className="create__field">
                  <label className="create__label">Beskrivning</label>
                  <textarea
                    className="create__textarea"
                    placeholder="Beskriv vad du erbjuder, din erfarenhet och vad som ingår..."
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                    rows={6}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Steg 3 – Pris & plats */}
          {step === 2 && (
            <div className="create__content">
              <h1 className="create__title">Pris & plats</h1>
              <p className="create__subtitle">Hur vill du ta betalt och var utför du tjänsten?</p>

              <div className="create__fields">
                <div className="create__field">
                  <label className="create__label">Pristyp</label>
                  <div className="create__price-types">
                    {(['timpris', 'fastpris', 'offert'] as PriceType[]).map(pt => (
                      <button
                        key={pt}
                        className={`create__price-type-btn ${form.priceType === pt ? 'create__price-type-btn--active' : ''}`}
                        onClick={() => update('priceType', pt)}
                        type="button"
                      >
                        {pt === 'timpris' ? '⏱️ Timpris' : pt === 'fastpris' ? '💰 Fast pris' : '📋 Ge prisförslag'}
                      </button>
                    ))}
                  </div>
                </div>

                {form.priceType !== 'offert' && (
                  <div className="create__field">
                    <label className="create__label">
                      {form.priceType === 'timpris' ? 'Pris per timme (kr)' : 'Fast pris (kr)'}
                    </label>
                    <input
                      className="create__input"
                      placeholder="T.ex. 350"
                      type="number"
                      value={form.price}
                      onChange={e => update('price', e.target.value)}
                    />
                  </div>
                )}

                <div className="create__field">
                  <label className="create__label">Plats</label>
                  <input
                    className="create__input"
                    placeholder="T.ex. Stockholm eller Digitalt"
                    value={form.location}
                    onChange={e => update('location', e.target.value)}
                  />
                </div>

                <div className="create__field">
                  <label className="create__label">Kontakt-e-post</label>
                  <input
                    className="create__input"
                    placeholder="din@email.se"
                    type="email"
                    value={form.contactEmail}
                    onChange={e => update('contactEmail', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Steg 4 – Egna frågor */}
          {step === 3 && (
            <div className="create__content">
              <h1 className="create__title">Egna frågor</h1>
              <p className="create__subtitle">
                Lägg till frågor du vill ställa till dina beställare. Max 5 frågor.
              </p>

              {/* Befintliga frågor */}
              {form.customQuestions.length > 0 && (
                <div className="create__custom-questions">
                  {form.customQuestions.map((q, index) => (
                    <div key={q.id} className="create__custom-question">
                      <div className="create__custom-question-info">
                        <strong>{q.label}</strong>
                        <span>{q.type === 'text' ? 'Fritext' : q.type === 'textarea' ? 'Långt svar' : `Val: ${q.options?.join(', ')}`}</span>
                        {q.required && <span className="create__custom-question-required">Obligatorisk</span>}
                      </div>
                      <button
                        type="button"
                        className="create__custom-question-remove"
                        onClick={() => {
                          setForm(prev => ({
                            ...prev,
                            customQuestions: prev.customQuestions.filter((_, i) => i !== index)
                          }))
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Lägg till ny fråga */}
              {form.customQuestions.length < 5 && (
                <div className="create__add-question card">
                  <h3 className="create__add-question-title">+ Lägg till fråga</h3>

                  <div className="create__fields">
                    <div className="create__field">
                      <label className="create__label">Fråga</label>
                      <input
                        className="create__input"
                        placeholder="T.ex. Har du egna verktyg?"
                        value={newQuestion.label}
                        onChange={e => setNewQuestion(prev => ({ ...prev, label: e.target.value }))}
                      />
                    </div>

                    <div className="create__field">
                      <label className="create__label">Svarstyp</label>
                      <div className="create__price-types">
                        {(['text', 'textarea', 'select'] as const).map(type => (
                          <button
                            key={type}
                            type="button"
                            className={`create__price-type-btn ${newQuestion.type === type ? 'create__price-type-btn--active' : ''}`}
                            onClick={() => setNewQuestion(prev => ({ ...prev, type }))}
                          >
                            {type === 'text' ? '✏️ Kort svar' : type === 'textarea' ? '📝 Långt svar' : '📋 Flerval'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {newQuestion.type === 'select' && (
                      <div className="create__field">
                        <label className="create__label">Svarsalternativ</label>
                        <input
                          className="create__input"
                          placeholder="Separera med komma, t.ex. Ja,Nej,Vet ej"
                          value={newQuestion.options}
                          onChange={e => setNewQuestion(prev => ({ ...prev, options: e.target.value }))}
                        />
                      </div>
                    )}

                    <div className="create__field">
                      <label className="create__checkbox-label">
                        <input
                          type="checkbox"
                          checked={newQuestion.required}
                          onChange={e => setNewQuestion(prev => ({ ...prev, required: e.target.checked }))}
                        />
                        Obligatorisk fråga
                      </label>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={!newQuestion.label || (newQuestion.type === 'select' && !newQuestion.options)}
                      onClick={() => {
                        const question: CustomQuestion = {
                          id: Date.now().toString(),
                          label: newQuestion.label,
                          type: newQuestion.type,
                          options: newQuestion.type === 'select'
                            ? newQuestion.options.split(',').map(o => o.trim()).filter(Boolean)
                            : undefined,
                          required: newQuestion.required,
                        }
                        setForm(prev => ({
                          ...prev,
                          customQuestions: [...prev.customQuestions, question]
                        }))
                        setNewQuestion({ label: '', type: 'text', options: '', required: false })
                      }}
                    >
                      Lägg till fråga
                    </button>
                  </div>
                </div>
              )}

              {form.customQuestions.length === 0 && (
                <p className="create__skip-hint">
                  💡 Du kan hoppa över detta steg om du inte vill lägga till egna frågor.
                </p>
              )}
            </div>
          )}

          {/* Steg 5 – Granska */}
          {step === 4 && (
            <div className="create__content">
              <h1 className="create__title">Granska & publicera</h1>
              <p className="create__subtitle">Kontrollera att allt stämmer innan du publicerar.</p>

              <div className="create__review">
                <div className="create__review-row">
                  <span className="create__review-label">Kategori</span>
                  <span>{selectedCategory?.label} – {form.subcategory}</span>
                </div>
                <div className="create__review-row">
                  <span className="create__review-label">Titel</span>
                  <span>{form.title}</span>
                </div>
                <div className="create__review-row">
                  <span className="create__review-label">Beskrivning</span>
                  <span>{form.description}</span>
                </div>
                <div className="create__review-row">
                  <span className="create__review-label">Pris</span>
                  <span>
                    {form.priceType === 'offert'
                      ? 'Offert'
                      : `${form.price} kr (${form.priceType})`}
                  </span>
                </div>
                <div className="create__review-row">
                  <span className="create__review-label">Plats</span>
                  <span>{form.location}</span>
                </div>
                <div className="create__review-row">
                  <span className="create__review-label">Kontakt</span>
                  <span>{form.contactEmail}</span>
                </div>
                <div className="create__review-row">
                  <span className="create__review-label">Egna frågor</span>
                  <span>{form.customQuestions.length > 0 ? `${form.customQuestions.length} frågor` : 'Inga'}</span>
                </div>

              </div>
            </div>
          )}

          {/* Navigering */}
          <div className="create__nav">
            {step > 0 && (
              <button
                className="btn btn-outline"
                onClick={() => setStep(step - 1)}
                type="button"
              >
                ← Tillbaka
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                className="btn btn-primary"
                onClick={() => setStep(step + 1)}
                type="button"
                disabled={
                  (step === 0 && (!form.categoryId || !form.subcategory)) ||
                  (step === 1 && (!form.title || !form.description)) ||
                  (step === 2 && (!form.location || (form.priceType !== 'offert' && !form.price)))
                }
              >
                Nästa →
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={saving}
                type="button"
              >
                {saving ? 'Publicerar...' : '🚀 Publicera tjänst'}
              </button>
            )}
          </div>

        </div>
      </div>
            {/* Success popup */}
      {showSuccess && (
        <div className="create__overlay">
          <div className="create__success-modal">
            <div className="create__success-emoji">🎉</div>
            <h2 className="create__success-title">Vad kul att du kommit igång!</h2>
            <p className="create__success-text">
              Ditt inlägg är nu publicerat och synligt för alla på Svippo. Lycka till!
            </p>
            <div className="create__success-actions">
              <button
                className="btn btn-primary"
                onClick={() => navigate('/profil')}
              >
                Till din profil
              </button>
              <button
                className="btn btn-outline"
                onClick={() => navigate('/tjanster')}
              >
                Till ditt inlägg
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default CreateService
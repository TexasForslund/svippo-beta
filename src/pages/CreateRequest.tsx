import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import useAuth from '../hooks/useAuth'
import { categories } from '../data/categories'
import './CreateRequest.css'

type FormData = {
  title: string
  description: string
  categoryId: string
  subcategory: string
  budgetType: 'fast' | 'prisforslag'
  budget: string
  deadline: string
  location: string
  contactEmail: string
  imageBase64: string
}

const STEPS = ['Kategori', 'Detaljer', 'Budget & plats', 'Granska']

function CreateRequest() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    categoryId: '',
    subcategory: '',
    budgetType: 'fast',
    budget: '',
    deadline: '',
    location: '',
    contactEmail: user?.email || '',
    imageBase64: '',
  })

  useEffect(() => {
    if (user?.email) {
      update('contactEmail', user.email)
    }
  }, [user])

  if (loading) return <div className="create-loading">Laddar...</div>
  if (!user) {
    navigate('/logga-in')
    return null
  }

  const selectedCategory = categories.find(c => c.id === form.categoryId)

  const update = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 1024) {
      alert('Bilden är för stor! Max 1MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setImagePreview(base64)
      update('imageBase64', base64)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await addDoc(collection(db, 'requests'), {
        ...form,
        userId: user.uid,
        userName: user.displayName || user.email,
        userEmail: user.email,
        status: 'open',
        interests: 0,
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
              <h1 className="create__title">Vad behöver du hjälp med?</h1>
              <p className="create__subtitle">Välj den kategori som passar bäst</p>

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
              <h1 className="create__title">Beskriv din förfrågan</h1>
              <p className="create__subtitle">Ju mer detaljer, desto bättre svar!</p>

              <div className="create__fields">
                <div className="create__field">
                  <label className="create__label">Rubrik</label>
                  <input
                    className="create__input"
                    placeholder="T.ex. Söker snickare för att bygga staket"
                    value={form.title}
                    onChange={e => update('title', e.target.value)}
                  />
                </div>

                <div className="create__field">
                  <label className="create__label">Beskrivning</label>
                  <textarea
                    className="create__textarea"
                    placeholder="Beskriv vad du behöver hjälp med, när och eventuella krav..."
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                    rows={6}
                  />
                </div>

                {/* Bilduppladdning */}
                <div className="create__field">
                  <label className="create__label">Bild (valfritt)</label>
                  <div className="create__image-upload">
                    {imagePreview ? (
                      <div className="create__image-preview">
                        <img src={imagePreview} alt="Förhandsgranskning" />
                        <button
                          className="create__image-remove"
                          onClick={() => {
                            setImagePreview(null)
                            update('imageBase64', '')
                          }}
                          type="button"
                        >
                          ✕ Ta bort bild
                        </button>
                      </div>
                    ) : (
                      <label className="create__image-label">
                        <span>📷 Klicka för att ladda upp bild</span>
                        <span className="create__image-hint">Max 1MB – JPG, PNG</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          onChange={handleImage}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Steg 3 – Budget & plats */}
          {step === 2 && (
            <div className="create__content">
              <h1 className="create__title">Budget & plats</h1>
              <p className="create__subtitle">Vad är din budget och var ska jobbet utföras?</p>

              <div className="create__fields">

                {/* Budgettyp */}
                <div className="create__field">
                  <label className="create__label">Hur vill du hantera priset?</label>
                  <div className="create__price-types">
                    <button
                      type="button"
                      className={`create__price-type-btn ${form.budgetType === 'fast' ? 'create__price-type-btn--active' : ''}`}
                      onClick={() => update('budgetType', 'fast')}
                    >
                      💰 Sätt egen budget
                    </button>
                    <button
                      type="button"
                      className={`create__price-type-btn ${form.budgetType === 'prisforslag' ? 'create__price-type-btn--active' : ''}`}
                      onClick={() => update('budgetType', 'prisforslag')}
                    >
                      📋 Be om prisförslag
                    </button>
                  </div>
                </div>

                {/* Budget – visas bara om fast */}
                {form.budgetType === 'fast' && (
                  <div className="create__field">
                    <label className="create__label">Din budget (kr)</label>
                    <input
                      className="create__input"
                      placeholder="T.ex. 2000"
                      type="number"
                      value={form.budget}
                      onChange={e => update('budget', e.target.value)}
                    />
                  </div>
                )}

                {/* Deadline */}
                <div className="create__field">
                  <label className="create__label">Deadline</label>
                  <div className="create__price-types">
                    <button
                      type="button"
                      className={`create__price-type-btn ${form.deadline === 'ingen' ? 'create__price-type-btn--active' : ''}`}
                      onClick={() => update('deadline', 'ingen')}
                    >
                      🕐 Ingen deadline
                    </button>
                    <button
                      type="button"
                      className={`create__price-type-btn ${form.deadline !== 'ingen' && form.deadline !== '' ? 'create__price-type-btn--active' : ''}`}
                      onClick={() => update('deadline', new Date().toISOString().split('T')[0])}
                    >
                      📅 Sätt deadline
                    </button>
                  </div>

                  {/* Datumväljare – visas bara om man valt deadline */}
                  {form.deadline !== 'ingen' && form.deadline !== '' && (
                    <input
                      className="create__input"
                      type="date"
                      value={form.deadline}
                      onChange={e => update('deadline', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      style={{ marginTop: '10px' }}
                    />
                  )}
                </div>

                {/* Plats */}
                <div className="create__field">
                  <label className="create__label">Plats</label>
                  <input
                    className="create__input"
                    placeholder="T.ex. Stockholm eller Digitalt"
                    value={form.location}
                    onChange={e => update('location', e.target.value)}
                  />
                </div>

                {/* Kontakt */}
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

          {/* Steg 4 – Granska */}
          {step === 3 && (
            <div className="create__content">
              <h1 className="create__title">Granska & publicera</h1>
              <p className="create__subtitle">Kontrollera att allt stämmer innan du publicerar.</p>

              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Förhandsgranskning"
                  className="create__review-image"
                />
              )}

              <div className="create__review">
                <div className="create__review-row">
                  <span className="create__review-label">Kategori</span>
                  <span>{selectedCategory?.label} – {form.subcategory}</span>
                </div>
                <div className="create__review-row">
                  <span className="create__review-label">Rubrik</span>
                  <span>{form.title}</span>
                </div>
                <div className="create__review-row">
                  <span className="create__review-label">Beskrivning</span>
                  <span>{form.description}</span>
                </div>
                <div className="create__review-row">
                  <span className="create__review-label">Budget</span>
                  <span>
                    {form.budgetType === 'prisforslag'
                      ? 'Be om prisförslag'
                      : `${form.budget} kr`}
                  </span>
                </div>
                <div className="create__review-row">
                  <span className="create__review-label">Deadline</span>
                  <span>
                    {form.deadline === 'ingen' || form.deadline === ''
                      ? 'Ingen deadline'
                      : form.deadline}
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
                  (step === 2 && (!form.location || (form.budgetType === 'fast' && !form.budget)))
                }
              >
                Nästa →
              </button>
            ) : (
              <button
                className="btn btn-orange"
                onClick={handleSubmit}
                disabled={saving}
                type="button"
              >
                {saving ? 'Publicerar...' : '🚀 Publicera förfrågan'}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Success popup */}
      {showSuccess && (
        <div className="create__overlay">
          <div className="create__success-modal">
            <div className="create__success-emoji">🙌</div>
            <h2 className="create__success-title">Förfrågan publicerad!</h2>
            <p className="create__success-text">
              Din förfrågan är nu synlig för alla Svippare. Du får ett meddelande när någon visar intresse!
            </p>
            <div className="create__success-actions">
              <button
                className="btn btn-orange"
                onClick={() => navigate('/forfragningar')}
              >
                Till förfrågningar
              </button>
              <button
                className="btn btn-outline"
                onClick={() => navigate('/profil')}
              >
                Till din profil
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default CreateRequest
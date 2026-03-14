import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '../firebase'
import './Auth.css'

type AccountType = 'privatperson' | 'foretag' | 'uf-foretag'

type FormData = {
  name: string
  email: string
  password: string
  phone: string
}

function Register() {
    const navigate = useNavigate()
  const [accountType, setAccountType] = useState<AccountType>('privatperson')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

const onSubmit = async (data: FormData) => {
  setLoading(true)
  setError('')
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
    const user = userCredential.user

    await updateProfile(user, { displayName: data.name })

    await setDoc(doc(db, 'users', user.uid), {
      name: data.name,
      email: data.email,
      phone: data.phone,
      accountType,
      createdAt: new Date().toISOString(),
    })

    navigate('/')
  } catch (err: unknown) {
    const error = err as { code?: string }
    if (error.code === 'auth/email-already-in-use') {
      setError('Den här e-postadressen används redan.')
    } else if (error.code === 'auth/weak-password') {
      setError('Lösenordet måste vara minst 6 tecken.')
    } else {
      setError('Något gick fel. Försök igen.')
    }
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="auth">
      <div className="auth__card">

        <div className="auth__header">
          <h1 className="auth__title">Skapa konto</h1>
          <p className="auth__subtitle">Välj vilken typ av konto du vill skapa</p>
        </div>

        {/* Kontotyp */}
        <div className="auth__account-types">
          <button
            className={`auth__type-btn ${accountType === 'privatperson' ? 'auth__type-btn--active' : ''}`}
            onClick={() => setAccountType('privatperson')}
            type="button"
          >
            <span>👤</span>
            <span>Privatperson</span>
          </button>
          <button
            className={`auth__type-btn ${accountType === 'foretag' ? 'auth__type-btn--active' : ''}`}
            onClick={() => setAccountType('foretag')}
            type="button"
          >
            <span>🏢</span>
            <span>Företag</span>
          </button>
          <button
            className={`auth__type-btn ${accountType === 'uf-foretag' ? 'auth__type-btn--active' : ''}`}
            onClick={() => setAccountType('uf-foretag')}
            type="button"
          >
            <span>🎓</span>
            <span>UF-företag</span>
          </button>
        </div>

        {/* Formulär */}
        <form onSubmit={handleSubmit(onSubmit)} className="auth__form">

          <div className="auth__field">
            <label className="auth__label">Namn</label>
            <input
              className={`auth__input ${errors.name ? 'auth__input--error' : ''}`}
              placeholder="Ditt namn"
              {...register('name', { required: 'Namn krävs' })}
            />
            {errors.name && <span className="auth__error">{errors.name.message}</span>}
          </div>

          <div className="auth__field">
            <label className="auth__label">E-post</label>
            <input
              className={`auth__input ${errors.email ? 'auth__input--error' : ''}`}
              placeholder="din@email.se"
              type="email"
              {...register('email', { required: 'E-post krävs' })}
            />
            {errors.email && <span className="auth__error">{errors.email.message}</span>}
          </div>

          <div className="auth__field">
            <label className="auth__label">Telefonnummer</label>
            <input
              className={`auth__input ${errors.phone ? 'auth__input--error' : ''}`}
              placeholder="070-000 00 00"
              type="tel"
              {...register('phone', { required: 'Telefonnummer krävs' })}
            />
            {errors.phone && <span className="auth__error">{errors.phone.message}</span>}
          </div>

          <div className="auth__field">
            <label className="auth__label">Lösenord</label>
            <input
              className={`auth__input ${errors.password ? 'auth__input--error' : ''}`}
              placeholder="Minst 6 tecken"
              type="password"
              {...register('password', { required: 'Lösenord krävs', minLength: { value: 6, message: 'Minst 6 tecken' } })}
            />
            {errors.password && <span className="auth__error">{errors.password.message}</span>}
          </div>

          {error && <div className="auth__error-box">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary auth__submit"
            disabled={loading}
          >
            {loading ? 'Skapar konto...' : 'Skapa konto'}
          </button>

        </form>

        <p className="auth__switch">
          Har du redan ett konto?{' '}
          <Link to="/logga-in" className="auth__switch-link">Logga in här</Link>
        </p>

      </div>
    </div>
  )
}

export default Register
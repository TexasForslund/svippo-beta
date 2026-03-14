import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import './Auth.css'

type FormData = {
  email: string
  password: string
}

function Login() {
    const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password)
      navigate('/')
    }  catch (err: unknown) {
        
        const error = err as { code?: string }
        if (error.code === 'auth/invalid-credential') {
            setError('Fel e-post eller lösenord.')
        } else {
            setError('Något gick fel. Försök igen.')
        }
        }
     finally {
    setLoading(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth__card">

        <div className="auth__header">
          <h1 className="auth__title">Logga in</h1>
          <p className="auth__subtitle">Välkommen tillbaka!</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth__form">

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
            <label className="auth__label">Lösenord</label>
            <input
              className={`auth__input ${errors.password ? 'auth__input--error' : ''}`}
              placeholder="Ditt lösenord"
              type="password"
              {...register('password', { required: 'Lösenord krävs' })}
            />
            {errors.password && <span className="auth__error">{errors.password.message}</span>}
          </div>

          {error && <div className="auth__error-box">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary auth__submit"
            disabled={loading}
          >
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>

        </form>

        <p className="auth__switch">
          Inget konto?{' '}
          <Link to="/registrera" className="auth__switch-link">Skapa ett här</Link>
        </p>

      </div>
    </div>
  )
}

export default Login
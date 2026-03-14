import { useNavigate } from 'react-router-dom'
import './LoginPromptModal.css'

type Props = {
  message?: string
  onClose: () => void
}

function LoginPromptModal({ message = 'Du måste logga in för att fortsätta.', onClose }: Props) {
  const navigate = useNavigate()

  return (
    <div className="login-prompt-overlay" onClick={onClose}>
      <div className="login-prompt-modal" onClick={e => e.stopPropagation()}>
        <div className="login-prompt__icon">🔐</div>
        <h2 className="login-prompt__title">Logga in för att fortsätta</h2>
        <p className="login-prompt__message">{message}</p>
        <div className="login-prompt__actions">
          <button
            className="btn btn-primary"
            onClick={() => { onClose(); navigate('/logga-in') }}
          >
            Logga in
          </button>
          <button
            className="btn btn-outline"
            onClick={() => { onClose(); navigate('/registrera') }}
          >
            Skapa konto
          </button>
        </div>
        <button className="login-prompt__close" onClick={onClose}>Avbryt</button>
      </div>
    </div>
  )
}

export default LoginPromptModal
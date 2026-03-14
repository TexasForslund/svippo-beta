import { useNavigate } from 'react-router-dom'
import './CreateModal.css'

type Props = {
  onClose: () => void
}

function CreateModal({ onClose }: Props) {
  const navigate = useNavigate()

  const handleChoice = (path: string) => {
    onClose()
    navigate(path)
  }

  return (
    <div className="create-modal-overlay" onClick={onClose}>
      <div className="create-modal" onClick={e => e.stopPropagation()}>

        <div className="create-modal__header">
          <h2 className="create-modal__title">Vad vill du skapa?</h2>
          <button className="create-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="create-modal__options">

          <button
            className="create-modal__option create-modal__option--service"
            onClick={() => handleChoice('/skapa-inlagg')}
          >
            <div className="create-modal__option-icon">🛠️</div>
            <div className="create-modal__option-content">
              <strong>Erbjud en tjänst</strong>
              <p>Publicera din tjänst och börja ta emot beställningar</p>
            </div>
            <span className="create-modal__option-arrow">→</span>
          </button>

          <button
            className="create-modal__option create-modal__option--request"
            onClick={() => handleChoice('/skapa-forfragning')}
          >
            <div className="create-modal__option-icon">🙋</div>
            <div className="create-modal__option-content">
              <strong>Skapa en förfrågan</strong>
              <p>Beskriv vad du behöver hjälp med och få svar från Svippare</p>
            </div>
            <span className="create-modal__option-arrow">→</span>
          </button>

        </div>

      </div>
    </div>
  )
}

export default CreateModal
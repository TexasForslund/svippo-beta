import './Categories.css'

const categories = [
  { icon: '🖥️', label: 'Digitala tjänster' },
  { icon: '🎨', label: 'Medie & design' },
  { icon: '📚', label: 'Utbildning' },
  { icon: '🏠', label: 'Hushållstjänster' },
  { icon: '🚗', label: 'Biltjänster' },
  { icon: '💆', label: 'Skönhet & hälsa' },
  { icon: '🔨', label: 'Bygg & hantverk' },
  { icon: '🌿', label: 'Trädgård' },
  { icon: '📦', label: 'Frakt & flytt' },
]

function Categories() {
  return (
    <section className="categories">
      <div className="container">
        <div className="categories__grid">
          {categories.map((cat) => (
            <a href="#" key={cat.label} className="categories__item">
              <div className="categories__icon">{cat.icon}</div>
              <span className="categories__label">{cat.label}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Categories
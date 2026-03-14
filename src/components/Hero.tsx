import './Hero.css'

function Hero() {
  return (
    <section className="hero">
      {/* Moln-dekorationer */}
      <div className="hero__cloud hero__cloud--1" />
      <div className="hero__cloud hero__cloud--2" />
      <div className="hero__cloud hero__cloud--3" />
      <div className="hero__sun" />

      <div className="container hero__content">
        <h1 className="hero__title">
          Hitta tjänster för dig,{' '}
          <span className="hero__title--italic">i ditt område!</span>
        </h1>

        {/* Sökruta */}
        <div className="hero__search">
          <span className="hero__search-icon">🔍</span>
          <input
            type="text"
            placeholder="Vad vill du svippa?"
            className="hero__search-input"
          />
        </div>

        {/* Populära sökningar */}
        <div className="hero__tags">
          <span className="hero__tags-label">Jag söker:</span>
          <button className="hero__tag">Snickare</button>
          <button className="hero__tag">Hemsida</button>
          <button className="hero__tag">Däckbyte</button>
          <button className="hero__tag hero__tag--active">Utforska</button>
        </div>
      </div>
    </section>
  )
}

export default Hero
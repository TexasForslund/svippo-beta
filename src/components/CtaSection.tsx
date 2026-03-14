import './CtaSection.css'

function CtaSection() {
  return (
    <section className="cta">
      <div className="container cta__inner">

        <div className="cta__card cta__card--seller">
          <div className="cta__card-content">
            <span className="cta__badge">Bli Svippare</span>
            <h2 className="cta__title">Sälj dina tjänster</h2>
            <p className="cta__text">
              Skapa ett konto, publicera dina tjänster och börja tjäna pengar – helt gratis.
            </p>
            <a href="/registrera" className="btn btn-primary">Bli Svippare direkt →</a>
          </div>
          <div className="cta__illustration">🧑‍💻</div>
        </div>

        <div className="cta__card cta__card--buyer">
          <div className="cta__card-content">
            <span className="cta__badge cta__badge--orange">Hitta hjälp</span>
            <h2 className="cta__title">Få hjälp i din vardag</h2>
            <p className="cta__text">
              Hitta pålitliga personer nära dig som kan hjälpa dig med precis det du behöver.
            </p>
            <a href="/tjanster" className="btn btn-orange">Utforska tjänster →</a>
          </div>
          <div className="cta__illustration">🛠️</div>
        </div>

      </div>

      {/* Nedre CTA */}
      <div className="cta__bottom">
        <div className="container cta__bottom-inner">
          <h2 className="cta__bottom-title">
            Skapa ett konto helt gratis idag<br />
            och bli en del av familjen
          </h2>
          <p className="cta__bottom-text">
            Upptäck hur enkelt det är att förvandla dina projekt eller uppgifter till
            verklighet med hjälp av en Svippare.
          </p>
          <div className="cta__bottom-actions">
            <a href="/registrera" className="btn btn-primary">Skapa ett konto</a>
            <a href="/tjanster" className="btn btn-outline-white">Utforska tjänster</a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CtaSection
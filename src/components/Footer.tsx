import './Footer.css'
import logo from '../assets/logo.svg'

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">

        {/* Logga & slogan */}
        <div className="footer__brand">
          <img src={logo} alt="Svippo" height={32} />
          <p className="footer__slogan">Där drömmar går i uppfyllelse</p>
        </div>

        {/* Kolumner */}
        <div className="footer__columns">

          <div className="footer__column">
            <h4 className="footer__heading">Svippo</h4>
            <a href="/om-oss">Om oss</a>
            <a href="/var-historia">Vår historia</a>
            <a href="/blogg">Blogg</a>
          </div>

          <div className="footer__column">
            <h4 className="footer__heading">Tjänster</h4>
            <a href="/tjanster/digitala">Digitala tjänster</a>
            <a href="/tjanster/medie-design">Medie och design</a>
            <a href="/tjanster/utbildning">Utbildning</a>
            <a href="/tjanster/hushall">Hushållstjänster</a>
            <a href="/tjanster/bil">Biltjänster</a>
            <a href="/tjanster/skonhet">Skönhet och hälsa</a>
          </div>

          <div className="footer__column">
            <h4 className="footer__heading">Svippo hjälp</h4>
            <a href="/hjalp/svippare">Vara svippare</a>
            <a href="/hjalp/bestallare">Vara beställare</a>
            <a href="/hjalp/foretag">Vara företag</a>
            <a href="/faq">FAQ</a>
          </div>

          <div className="footer__column">
            <h4 className="footer__heading">Kontakt</h4>
            <a href="mailto:kontakt@svippo.se">kontakt@svippo.se</a>
            <a href="tel:020105707">020-105 707</a>
          </div>

        </div>
      </div>

      {/* Botten */}
      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <span>© {new Date().getFullYear()} Svippo. Alla rättigheter förbehållna.</span>
          <div className="footer__bottom-links">
            <a href="/integritetspolicy">Integritetspolicy</a>
            <a href="/villkor">Användarvillkor</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
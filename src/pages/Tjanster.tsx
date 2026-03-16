import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { Link } from 'react-router-dom'
import { categories } from '../data/categories'
import { useSearchParams } from 'react-router-dom'
import type { Timestamp } from 'firebase/firestore'
import './Tjanster.css'

type Service = {
  id: string
  title: string
  description: string
  categoryId: string
  subcategory: string
  priceType: string
  price: string
  location: string
  userName: string
  userEmail: string
  userId: string
  rating: number
  reviews: number
  createdAt: Timestamp
}

function Tjanster() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const searchFromUrl = searchParams.get('search')
    if (searchFromUrl) {
      setSearch(searchFromUrl)
    }
  }, [searchParams])

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const q = query(collection(db, 'services'), orderBy('createdAt', 'desc'))
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Service[]
        setServices(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  // Unika platser från tjänsterna
  const locations = [...new Set(services.map(s => s.location).filter(Boolean))]

  // Filtrering
  const filtered = services
    .filter(s => {
      const matchSearch = search === '' ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()) ||
        s.subcategory.toLowerCase().includes(search.toLowerCase())
      const matchCategory = selectedCategory === '' || s.categoryId === selectedCategory
      const matchLocation = selectedLocation === '' || s.location === selectedLocation
      return matchSearch && matchCategory && matchLocation
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return Number(a.price) - Number(b.price)
      if (sortBy === 'price_desc') return Number(b.price) - Number(a.price)
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
      return 0 // newest – redan sorterat från Firebase
    })

  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSelectedLocation('')
    setSortBy('newest')
  }

  const hasFilters = search || selectedCategory || selectedLocation || sortBy !== 'newest'

  return (
    <div className="tjanster">
      <div className="container tjanster__inner">

        {/* Header */}
        <div className="tjanster__header">
          <h1 className="tjanster__title">Tjänster</h1>
          <p className="tjanster__subtitle">{filtered.length} tjänster hittades</p>
        </div>

        {/* Sök & filter */}
        <div className="tjanster__filters">

          {/* Sökruta */}
          <div className="tjanster__search">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Sök tjänster..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="tjanster__search-input"
            />
            {search && (
              <button className="tjanster__clear-search" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          {/* Filter-rad */}
          <div className="tjanster__filter-row">

            {/* Kategori */}
            <select
              className="tjanster__select"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">Alla kategorier</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
              ))}
            </select>

            {/* Plats */}
            <select
              className="tjanster__select"
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
            >
              <option value="">Alla platser</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            {/* Sortera */}
            <select
              className="tjanster__select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="newest">Nyast först</option>
              <option value="price_asc">Lägst pris</option>
              <option value="price_desc">Högst pris</option>
              <option value="rating">Bäst betyg</option>
            </select>

            {/* Rensa filter */}
            {hasFilters && (
              <button className="tjanster__clear-btn" onClick={clearFilters}>
                Rensa filter
              </button>
            )}

          </div>
        </div>

        {/* Aktiva filter-taggar */}
        {hasFilters && (
          <div className="tjanster__active-filters">
            {search && (
              <span className="tjanster__filter-tag">
                🔍 "{search}"
                <button onClick={() => setSearch('')}>✕</button>
              </span>
            )}
            {selectedCategory && (
              <span className="tjanster__filter-tag">
                {categories.find(c => c.id === selectedCategory)?.label}
                <button onClick={() => setSelectedCategory('')}>✕</button>
              </span>
            )}
            {selectedLocation && (
              <span className="tjanster__filter-tag">
                📍 {selectedLocation}
                <button onClick={() => setSelectedLocation('')}>✕</button>
              </span>
            )}
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="tjanster__loading">Laddar tjänster...</div>
        ) : filtered.length === 0 ? (
          <div className="tjanster__empty">
            <p>Inga tjänster matchar din sökning.</p>
            <button className="btn btn-outline" onClick={clearFilters}>Rensa filter</button>
          </div>
        ) : (
          <div className="tjanster__list">
            {filtered.map(s => (
              <Link to={`/tjanst/${s.id}`} key={s.id} className="service-card card">
                <div className="service-card__avatar">
                  <div className="service-card__avatar-placeholder">
                    {s.userName?.charAt(0).toUpperCase() || '?'}
                  </div>
                </div>

                <div className="service-card__info">
                  <div className="service-card__meta">
                    <span className="service-card__name">{s.userName}</span>
                    <span className="star-rating">⭐ <strong>{s.rating || '–'}</strong></span>
                    <span className="service-card__reviews">({s.reviews})</span>
                    <span className="service-card__distance">· {s.location}</span>
                  </div>
                  <p className="service-card__title">{s.title}</p>
                  <span className="service-card__category">{s.subcategory}</span>
                </div>

                <div className="service-card__price">
                  <span className="service-card__price-type">
                    {s.priceType === 'offert' ? '' : 'från:'}
                  </span>
                  <strong>
                    {s.priceType === 'offert' ? 'Offert' : `${s.price} kr`}
                  </strong>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default Tjanster
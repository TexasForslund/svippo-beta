import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { Link } from 'react-router-dom'
import { categories } from '../data/categories'
import type { Timestamp } from 'firebase/firestore'
import './Requests.css'

type Request = {
  id: string
  title: string
  description: string
  subcategory: string
  categoryId: string
  budget: string
  location: string
  userName: string
  imageBase64: string
  interests: number
  createdAt: Timestamp
}

function Requests() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'))
        const snapshot = await getDocs(q)
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Request[]
        setRequests(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchRequests()
  }, [])

  // Unika platser
  const locations = [...new Set(requests.map(r => r.location).filter(Boolean))]

  // Filtrering
  const filtered = requests
    .filter(r => {
      const matchSearch = search === '' ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.subcategory.toLowerCase().includes(search.toLowerCase())
      const matchCategory = selectedCategory === '' || r.categoryId === selectedCategory
      const matchLocation = selectedLocation === '' || r.location === selectedLocation
      return matchSearch && matchCategory && matchLocation
    })
    .sort((a, b) => {
      if (sortBy === 'budget_asc') return Number(a.budget) - Number(b.budget)
      if (sortBy === 'budget_desc') return Number(b.budget) - Number(a.budget)
      return 0
    })

  const clearFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSelectedLocation('')
    setSortBy('newest')
  }

  const hasFilters = search || selectedCategory || selectedLocation || sortBy !== 'newest'

  return (
    <div className="requests">
      <div className="container requests__inner">

        {/* Header */}
        <div className="requests__header">
          <div>
            <h1 className="requests__title">Förfrågningar</h1>
            <p className="requests__subtitle">{filtered.length} förfrågningar hittades</p>
          </div>
          <Link to="/skapa-forfragning" className="btn btn-orange">
            + Skapa förfrågan
          </Link>
        </div>

        {/* Sök & filter */}
        <div className="requests__filters">

          <div className="tjanster__search">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Sök förfrågningar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="tjanster__search-input"
            />
            {search && (
              <button className="tjanster__clear-search" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          <div className="tjanster__filter-row">

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

            <select
              className="tjanster__select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="newest">Nyast först</option>
              <option value="budget_asc">Lägst budget</option>
              <option value="budget_desc">Högst budget</option>
            </select>

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
          <div className="tjanster__loading">Laddar förfrågningar...</div>
        ) : filtered.length === 0 ? (
          <div className="tjanster__empty">
            <p>Inga förfrågningar matchar din sökning.</p>
            <button className="btn btn-outline" onClick={clearFilters}>Rensa filter</button>
          </div>
        ) : (
          <div className="requests__list">
            {filtered.map(r => (
              <Link to={`/forfragning/${r.id}`} key={r.id} className="request-card card">

                {r.imageBase64 && (
                  <div className="request-card__image">
                    <img src={r.imageBase64} alt={r.title} />
                  </div>
                )}

                <div className="request-card__content">
                  <div className="request-card__meta">
                    <span className="request-card__category">{r.subcategory}</span>
                    <span className="request-card__location">📍 {r.location}</span>
                  </div>

                  <h2 className="request-card__title">{r.title}</h2>
                  <p className="request-card__description">{r.description}</p>

                  <div className="request-card__footer">
                    <div className="request-card__user">
                      <div className="request-card__avatar">
                        {r.userName?.charAt(0).toUpperCase()}
                      </div>
                      <span>{r.userName}</span>
                    </div>
                    <div className="request-card__budget">
                      <span>Budget:</span>
                      <strong>{r.budget} kr</strong>
                    </div>
                  </div>
                </div>

              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default Requests
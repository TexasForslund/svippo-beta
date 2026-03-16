import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import './SearchBar.css'

type Service = {
  id: string
  title: string
  subcategory: string
  location: string
  price: string
  priceType: string
  userName: string
}

type Request = {
  id: string
  title: string
  subcategory: string
  location: string
  budget: string
  userName: string
}

type SearchType = 'tjanster' | 'forfragningar'

type Props = {
  hideTypePicker?: boolean
  defaultType?: SearchType
}

function SearchBar({ hideTypePicker = false, defaultType = 'tjanster' }: Props) {
  const navigate = useNavigate()
  const [searchType, setSearchType] = useState<SearchType>(defaultType)
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showTypePicker, setShowTypePicker] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Stäng dropdown vid klick utanför
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
        setShowTypePicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Hämta data när sökning ändras
  useEffect(() => {
    if (search.length < 2) {
      setServices([])
      setRequests([])
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      try {
        if (searchType === 'tjanster') {
          const snap = await getDocs(query(collection(db, 'services'), orderBy('createdAt', 'desc')))
          const all = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Service[]
          const filtered = all.filter(s =>
            s.title?.toLowerCase().includes(search.toLowerCase()) ||
            s.subcategory?.toLowerCase().includes(search.toLowerCase()) ||
            s.userName?.toLowerCase().includes(search.toLowerCase())
          ).slice(0, 3)
          setServices(filtered)
        } else {
          const snap = await getDocs(query(collection(db, 'requests'), orderBy('createdAt', 'desc')))
          const all = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Request[]
          const filtered = all.filter(r =>
            r.title?.toLowerCase().includes(search.toLowerCase()) ||
            r.subcategory?.toLowerCase().includes(search.toLowerCase()) ||
            r.userName?.toLowerCase().includes(search.toLowerCase())
          ).slice(0, 3)
          setRequests(filtered)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(fetchResults, 300)
    return () => clearTimeout(timer)
  }, [search, searchType])

  const handleFocus = () => {
    if (!search && !hideTypePicker) {
      setShowTypePicker(true)
      setShowDropdown(false)
    } else if (search) {
      setShowDropdown(true)
      setShowTypePicker(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setShowTypePicker(false)
    if (e.target.value.length >= 2) {
      setShowDropdown(true)
    } else {
      setShowDropdown(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search) {
      navigate(`/${searchType}?search=${encodeURIComponent(search)}`)
      setShowDropdown(false)
      setSearch('')
    }
  }

  const handleTypeSelect = (type: SearchType) => {
    setSearchType(type)
    setShowTypePicker(false)
  }

  const results = searchType === 'tjanster' ? services : requests

  return (
    <div className="searchbar" ref={wrapperRef}>

      {/* Sökfält */}
      <div className={`searchbar__input-wrapper ${showDropdown || showTypePicker ? 'searchbar__input-wrapper--active' : ''}`}>

        {/* Typ-knapp */}
        {!hideTypePicker && (
          <>
            <button
              className="searchbar__type-btn"
              onClick={() => {
                setShowTypePicker(!showTypePicker)
                setShowDropdown(false)
              }}
              type="button"
            >
              {searchType === 'tjanster' ? '🛠️ Tjänster' : '🙋 Förfrågningar'}
              <span className="searchbar__type-arrow">▾</span>
            </button>
            <div className="searchbar__divider" />
          </>
        )}

        <span className="searchbar__icon">🔍</span>
        <input
          type="text"
          className="searchbar__input"
          placeholder={`Sök ${searchType === 'tjanster' ? 'tjänster' : 'förfrågningar'}...`}
          value={search}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        />

        {search && (
          <button
            className="searchbar__clear"
            onClick={() => {
              setSearch('')
              setShowDropdown(false)
            }}
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      {/* Typ-väljare */}
      {showTypePicker && !hideTypePicker && (
        <div className="searchbar__dropdown">
          <p className="searchbar__dropdown-hint">Vad letar du efter?</p>
          <button
            className={`searchbar__type-option ${searchType === 'tjanster' ? 'searchbar__type-option--active' : ''}`}
            onClick={() => handleTypeSelect('tjanster')}
            type="button"
          >
            <span>🛠️</span>
            <div>
              <strong>Tjänster</strong>
              <span>Hitta någon som kan hjälpa dig</span>
            </div>
          </button>
          <button
            className={`searchbar__type-option ${searchType === 'forfragningar' ? 'searchbar__type-option--active' : ''}`}
            onClick={() => handleTypeSelect('forfragningar')}
            type="button"
          >
            <span>🙋</span>
            <div>
              <strong>Förfrågningar</strong>
              <span>Hitta uppdrag att utföra</span>
            </div>
          </button>
        </div>
      )}

      {/* Sökresultat */}
      {showDropdown && search.length >= 2 && (
        <div className="searchbar__dropdown">
          {loading ? (
            <div className="searchbar__loading">Söker...</div>
          ) : results.length === 0 ? (
            <div className="searchbar__empty">
              Inga {searchType === 'tjanster' ? 'tjänster' : 'förfrågningar'} hittades för "{search}"
            </div>
          ) : (
            <>
              <p className="searchbar__dropdown-hint">
                {searchType === 'tjanster' ? '🛠️ Tjänster' : '🙋 Förfrågningar'}
              </p>
              {searchType === 'tjanster'
                ? services.map(s => (
                  <Link
                    key={s.id}
                    to={`/tjanst/${s.id}`}
                    className="searchbar__result"
                    onClick={() => { setShowDropdown(false); setSearch('') }}
                  >
                    <div className="searchbar__result-info">
                      <strong>{s.title}</strong>
                      <span>{s.subcategory} · {s.location}</span>
                    </div>
                    <span className="searchbar__result-price">
                      {s.priceType === 'offert' ? 'Offert' : `${s.price} kr`}
                    </span>
                  </Link>
                ))
                : requests.map(r => (
                  <Link
                    key={r.id}
                    to={`/forfragning/${r.id}`}
                    className="searchbar__result"
                    onClick={() => { setShowDropdown(false); setSearch('') }}
                  >
                    <div className="searchbar__result-info">
                      <strong>{r.title}</strong>
                      <span>{r.subcategory} · {r.location}</span>
                    </div>
                    <span className="searchbar__result-price searchbar__result-price--orange">
                      {r.budget} kr
                    </span>
                  </Link>
                ))
              }
            </>
          )}

          {/* Se alla */}
          <Link
            to={`/${searchType}?search=${encodeURIComponent(search)}`}
            className="searchbar__see-all"
            onClick={() => { setShowDropdown(false); setSearch('') }}
          >
            Se alla resultat för "{search}" →
          </Link>
        </div>
      )}

    </div>
  )
}

export default SearchBar
import { useState } from 'react'

interface SearchPageProps {
  onBack: () => void
  onSearch: (query: string) => void
}

function SearchPage({ onBack, onSearch }: SearchPageProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="page-header-content">
          <h1>Search Organizations</h1>
          <p>Find an existing organization to add sub-orgs or practices</p>
        </div>
      </header>

      <main className="page-content">
        <form className="search-form" onSubmit={handleSubmit}>
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input-large"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, Salesforce ID, or city..."
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary btn-large" disabled={!query.trim()}>
            Search
          </button>
        </form>

        <div className="search-hints">
          <h3>Search tips:</h3>
          <ul>
            <li>Search by organization name (e.g., "Northwell")</li>
            <li>Search by Salesforce ID (e.g., "01260000")</li>
            <li>Search by city (e.g., "Great Neck")</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

export default SearchPage

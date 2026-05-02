import { Organization } from '../types'

interface SearchResultsPageProps {
  query: string
  results: Organization[]
  onBack: () => void
  onSelect: (org: Organization) => void
}

function SearchResultsPage({ query, results, onBack, onSelect }: SearchResultsPageProps) {
  return (
    <div className="page">
      <header className="page-header">
        <button className="back-btn" onClick={onBack}>← Back to Search</button>
        <div className="page-header-content">
          <h1>Search Results</h1>
          <p>"{query}" — {results.length} organization{results.length !== 1 ? 's' : ''} found</p>
        </div>
      </header>

      <main className="page-content">
        {results.length > 0 ? (
          <div className="results-list">
            {results.map((org) => (
              <button
                key={org.id}
                className="result-card"
                onClick={() => onSelect(org)}
              >
                <div className="result-main">
                  <h3 className="result-name">{org.name}</h3>
                  <div className="result-meta">
                    <span className="result-type">{org.type}</span>
                    {org.city && org.state && (
                      <span className="result-location">{org.city}, {org.state}</span>
                    )}
                    {org.salesforceId && (
                      <span className="result-id">ID: {org.salesforceId}</span>
                    )}
                  </div>
                </div>
                <div className="result-stats">
                  {org.children && org.children.length > 0 && (
                    <span className="result-children">{org.children.length} children</span>
                  )}
                  {org.providerCount !== undefined && (
                    <span className="result-providers">{org.providerCount.toLocaleString()} providers</span>
                  )}
                </div>
                <div className="result-arrow">→</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h2>No organizations found</h2>
            <p>Try a different search term</p>
            <button className="btn btn-primary" onClick={onBack}>
              Search Again
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default SearchResultsPage

interface HomePageProps {
  onCreateNew: () => void
  onSearch: () => void
}

function HomePage({ onCreateNew, onSearch }: HomePageProps) {
  return (
    <div className="page home-page">
      <div className="home-content">
        <div className="home-logo">🏢</div>
        <h1 className="home-title">Org Management</h1>
        <p className="home-subtitle">
          Create and manage organization hierarchies
        </p>

        <div className="home-actions">
          <button className="home-card" onClick={onCreateNew}>
            <div className="home-card-icon">➕</div>
            <div className="home-card-content">
              <h2>Create New Organization</h2>
              <p>Start fresh with a new top-level organization</p>
            </div>
            <div className="home-card-arrow">→</div>
          </button>

          <button className="home-card" onClick={onSearch}>
            <div className="home-card-icon">🔍</div>
            <div className="home-card-content">
              <h2>Search Existing</h2>
              <p>Find an organization and add sub-orgs or practices</p>
            </div>
            <div className="home-card-arrow">→</div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default HomePage

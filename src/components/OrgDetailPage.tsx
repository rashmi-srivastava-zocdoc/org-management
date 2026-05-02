import { Organization, Practice } from '../types'

interface OrgDetailPageProps {
  organization: Organization
  practices: Practice[]
  onBack: () => void
  onAddChild: () => void
  onSelectChild: (child: Organization) => void
}

function OrgDetailPage({ organization, practices, onBack, onAddChild, onSelectChild }: OrgDetailPageProps) {
  return (
    <div className="page">
      <header className="page-header">
        <button className="back-btn" onClick={onBack}>← Back to Results</button>
        <div className="page-header-content">
          <h1>{organization.name}</h1>
          <p>{organization.type} • {organization.city}, {organization.state}</p>
        </div>
      </header>

      <main className="page-content">
        <div className="detail-card">
          <h2>Organization Details</h2>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">ID</span>
              <span className="detail-value">{organization.id}</span>
            </div>
            {organization.salesforceId && (
              <div className="detail-item">
                <span className="detail-label">Salesforce ID</span>
                <span className="detail-value">{organization.salesforceId}</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Type</span>
              <span className="detail-value">{organization.type}</span>
            </div>
            {organization.owner && (
              <div className="detail-item">
                <span className="detail-label">Owner</span>
                <span className="detail-value">{organization.owner}</span>
              </div>
            )}
            {organization.providerCount !== undefined && (
              <div className="detail-item">
                <span className="detail-label">Provider Count</span>
                <span className="detail-value">{organization.providerCount.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {organization.children && organization.children.length > 0 && (
          <div className="detail-card">
            <h2>Child Organizations ({organization.children.length})</h2>
            <div className="children-list">
              {organization.children.map((child) => (
                <button
                  key={child.id}
                  className="child-card"
                  onClick={() => onSelectChild(child)}
                >
                  <div className="child-info">
                    <span className="child-name">{child.name}</span>
                    <span className="child-type">{child.type}</span>
                  </div>
                  {child.providerCount !== undefined && (
                    <span className="child-count">{child.providerCount} providers</span>
                  )}
                  <span className="child-arrow">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {practices.length > 0 && (
          <div className="detail-card">
            <h2>Practices ({practices.length})</h2>
            <div className="practices-list">
              {practices.map((practice) => (
                <div key={practice.id} className="practice-card">
                  <div className="practice-info">
                    <span className="practice-name">{practice.name}</span>
                    {practice.npi && (
                      <span className="practice-npi">NPI: {practice.npi}</span>
                    )}
                  </div>
                  {practice.city && practice.state && (
                    <span className="practice-location">{practice.city}, {practice.state}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="detail-actions">
          <button className="btn btn-primary btn-large" onClick={onAddChild}>
            ➕ Add Child Org or Practice
          </button>
        </div>
      </main>
    </div>
  )
}

export default OrgDetailPage

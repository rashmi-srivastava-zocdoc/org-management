import { Organization } from '../types'

interface CreateOrgSuccessPageProps {
  organization: Organization
  onAddChild: () => void
  onDone: () => void
}

function CreateOrgSuccessPage({ organization, onAddChild, onDone }: CreateOrgSuccessPageProps) {
  return (
    <div className="page">
      <main className="page-content centered">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h1>Organization Created!</h1>
          <p className="success-org-name">{organization.name}</p>

          <div className="success-details">
            <div className="success-detail">
              <span className="detail-label">Type</span>
              <span className="detail-value">{organization.type}</span>
            </div>
            {organization.city && organization.state && (
              <div className="success-detail">
                <span className="detail-label">Location</span>
                <span className="detail-value">{organization.city}, {organization.state}</span>
              </div>
            )}
            {organization.salesforceId && (
              <div className="success-detail">
                <span className="detail-label">Salesforce ID</span>
                <span className="detail-value">{organization.salesforceId}</span>
              </div>
            )}
          </div>

          <div className="success-prompt">
            <h2>What's next?</h2>
            <p>Would you like to add child organizations or practices?</p>
          </div>

          <div className="success-actions">
            <button className="btn btn-primary btn-large" onClick={onAddChild}>
              ➕ Add Child Org or Practice
            </button>
            <button className="btn btn-secondary" onClick={onDone}>
              Done for now
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CreateOrgSuccessPage

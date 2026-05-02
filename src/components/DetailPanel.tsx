import { Organization, AuditEntry, Member } from '../types'

interface DetailPanelProps {
  organization: Organization
  breadcrumb: Organization[]
  auditHistory: AuditEntry[]
  members: Member[]
  onEdit: () => void
  onSelectOrg: (org: Organization) => void
  allOrganizations: Organization[]
}

function DetailPanel({
  organization,
  breadcrumb,
  auditHistory,
  members,
  onEdit,
  onSelectOrg,
}: DetailPanelProps) {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getActionText = (entry: AuditEntry) => {
    switch (entry.action) {
      case 'created':
        return 'Organization created'
      case 'updated':
        return `${entry.field} changed from "${entry.oldValue}" to "${entry.newValue}"`
      case 'moved':
        return `Moved to ${entry.newValue}`
      case 'member_added':
        return `Added member: ${entry.newValue}`
      case 'member_removed':
        return `Removed member: ${entry.oldValue}`
      default:
        return entry.action
    }
  }

  const getActionIcon = (action: AuditEntry['action']) => {
    switch (action) {
      case 'created':
        return '✨'
      case 'updated':
        return '✏️'
      case 'moved':
        return '📦'
      case 'member_added':
        return '➕'
      case 'member_removed':
        return '➖'
      default:
        return '📝'
    }
  }

  return (
    <div className="detail-content">
      {breadcrumb.length > 1 && (
        <div className="breadcrumb">
          {breadcrumb.slice(0, -1).map((org, index) => (
            <span key={org.id}>
              <span
                className="breadcrumb-link"
                onClick={() => onSelectOrg(org)}
              >
                {org.name}
              </span>
              {index < breadcrumb.length - 2 && (
                <span className="breadcrumb-separator"> › </span>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="detail-header">
        <div>
          <h2 className="detail-title">{organization.name}</h2>
          <p className="detail-subtitle">
            {organization.type} • {organization.city}, {organization.state}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={onEdit}>
          Edit
        </button>
      </div>

      <div className="detail-section">
        <h3>Organization Details</h3>
        <div className="field-grid">
          <div className="field">
            <span className="field-label">ID</span>
            <span className="field-value">{organization.id}</span>
          </div>
          <div className="field">
            <span className="field-label">Salesforce ID</span>
            <span className="field-value">{organization.salesforceId || '—'}</span>
          </div>
          <div className="field">
            <span className="field-label">Type</span>
            <span className="field-value">{organization.type}</span>
          </div>
          <div className="field">
            <span className="field-label">Owner</span>
            <span className="field-value">{organization.owner || '—'}</span>
          </div>
          <div className="field">
            <span className="field-label">Location</span>
            <span className="field-value">
              {organization.city && organization.state
                ? `${organization.city}, ${organization.state}`
                : '—'}
            </span>
          </div>
          <div className="field">
            <span className="field-label">Provider Count</span>
            <span className="field-value">
              {organization.providerCount?.toLocaleString() || '—'}
            </span>
          </div>
        </div>
      </div>

      {organization.children && organization.children.length > 0 && (
        <div className="detail-section">
          <div className="children-header">
            <h3>Child Organizations ({organization.children.length})</h3>
            <button className="btn btn-secondary">+ Add Child</button>
          </div>
          <div className="children-section">
            {organization.children.map((child) => (
              <div
                key={child.id}
                className="child-item"
                onClick={() => onSelectOrg(child)}
              >
                <div className="child-info">
                  <span className="child-name">{child.name}</span>
                  <span className="child-type">{child.type}</span>
                </div>
                {child.providerCount !== undefined && (
                  <span className="org-count">{child.providerCount.toLocaleString()}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {members.length > 0 && (
        <div className="detail-section">
          <div className="children-header">
            <h3>Members ({members.length})</h3>
            <button className="btn btn-secondary">+ Add Member</button>
          </div>
          <div className="member-list">
            {members.map((member) => (
              <div key={member.id} className="member-item">
                <div className="member-info">
                  <span className="member-type">{member.type}</span>
                  <span className="member-name">{member.name}</span>
                </div>
                <button className="btn btn-secondary">Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="detail-section">
        <h3>Audit History</h3>
        {auditHistory.length > 0 ? (
          <div className="audit-list">
            {auditHistory.map((entry) => (
              <div key={entry.id} className="audit-item">
                <div className="audit-icon">{getActionIcon(entry.action)}</div>
                <div className="audit-content">
                  <div className="audit-action">{getActionText(entry)}</div>
                  <div className="audit-meta">
                    {entry.user} • {formatDate(entry.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6b7280', fontSize: '14px' }}>No audit history available</p>
        )}
      </div>
    </div>
  )
}

export default DetailPanel

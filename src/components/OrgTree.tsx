import { useState } from 'react'
import { Organization } from '../types'

interface OrgTreeProps {
  organizations: Organization[]
  selectedId?: string
  onSelect: (org: Organization) => void
  level?: number
}

function OrgTree({ organizations, selectedId, onSelect, level = 0 }: OrgTreeProps) {
  return (
    <div className="org-tree">
      {organizations.map((org) => (
        <OrgNode
          key={org.id}
          organization={org}
          selectedId={selectedId}
          onSelect={onSelect}
          level={level}
        />
      ))}
    </div>
  )
}

interface OrgNodeProps {
  organization: Organization
  selectedId?: string
  onSelect: (org: Organization) => void
  level: number
}

function OrgNode({ organization, selectedId, onSelect, level }: OrgNodeProps) {
  const [expanded, setExpanded] = useState(level === 0)
  const hasChildren = organization.children && organization.children.length > 0

  return (
    <div className="org-node">
      <div
        className={`org-row ${selectedId === organization.id ? 'selected' : ''}`}
        style={{ paddingLeft: `${16 + level * 24}px` }}
        onClick={() => onSelect(organization)}
      >
        {hasChildren ? (
          <button
            className="expand-btn"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
          >
            {expanded ? '▼' : '▶'}
          </button>
        ) : (
          <span className="expand-placeholder" />
        )}

        <span className="org-name">{organization.name}</span>

        {level === 0 && (
          <span className="org-badge">current</span>
        )}

        {organization.salesforceId && (
          <span className="org-meta">{organization.salesforceId}</span>
        )}

        {organization.city && (
          <span className="org-meta">{organization.city}</span>
        )}

        {organization.state && (
          <span className="org-meta">{organization.state}</span>
        )}

        {organization.owner && (
          <span className="org-meta">{organization.owner}</span>
        )}

        {organization.providerCount !== undefined && (
          <span className="org-count">{organization.providerCount.toLocaleString()}</span>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="org-children">
          <OrgTree
            organizations={organization.children!}
            selectedId={selectedId}
            onSelect={onSelect}
            level={level + 1}
          />
        </div>
      )}
    </div>
  )
}

export default OrgTree

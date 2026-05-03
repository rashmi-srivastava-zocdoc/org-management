import { useState } from 'react'
import { Organization, Practice } from './types'
import { mockOrganizations } from './data/mockData'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [resultType, setResultType] = useState<'organizations' | 'practices'>('organizations')
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null)
  const [organizations, setOrganizations] = useState(mockOrganizations)
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set(['org-1']))
  const [practices] = useState<Practice[]>([
    { id: 'p1', name: 'Northwell Health', npi: '174562', numActiveProviders: 0, cloudId: 'pL_nexM-oM58Eamot1thGiH8g', parentOrgId: 'org-1' },
    { id: 'p2', name: 'Great Neck Primary Care', npi: '182934', numActiveProviders: 12, cloudId: 'pL_abc123', parentOrgId: 'org-1' },
    { id: 'p3', name: 'Huntington Internal Medicine', npi: '192837', numActiveProviders: 8, cloudId: 'pL_xyz789', parentOrgId: 'org-1-7' },
  ])

  // Modal states
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false)
  const [showAddChildModal, setShowAddChildModal] = useState(false)
  const [showAddPracticeModal, setShowAddPracticeModal] = useState(false)
  const [showEditOrgModal, setShowEditOrgModal] = useState(false)
  const [showChangeParentModal, setShowChangeParentModal] = useState(false)

  // Flatten all orgs for search
  const flattenOrgs = (orgs: Organization[]): Organization[] => {
    const result: Organization[] = []
    const traverse = (org: Organization) => {
      result.push(org)
      org.children?.forEach(traverse)
    }
    orgs.forEach(traverse)
    return result
  }

  const allOrgs = flattenOrgs(organizations)

  // Search results
  const searchResults = searchQuery.trim()
    ? allOrgs.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.salesforceId?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  // Get practices for an org
  const getPracticesForOrg = (orgId: string): Practice[] => {
    return practices.filter(p => p.parentOrgId === orgId)
  }

  // Get all practices for selected org and its children
  const getAllPracticesForOrg = (org: Organization): Practice[] => {
    let result = getPracticesForOrg(org.id)
    org.children?.forEach(child => {
      result = [...result, ...getAllPracticesForOrg(child)]
    })
    return result
  }

  const handleSelectOrg = (org: Organization) => {
    setSelectedOrg(org)
    setSelectedPractice(null)
    setSearchQuery('')
    // Expand the org when selected
    setExpandedOrgs(prev => new Set([...prev, org.id]))
  }

  const toggleExpand = (orgId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedOrgs(prev => {
      const next = new Set(prev)
      if (next.has(orgId)) {
        next.delete(orgId)
      } else {
        next.add(orgId)
      }
      return next
    })
  }

  const handleCreateOrg = (newOrg: Partial<Organization>) => {
    const org: Organization = {
      id: `org_${Math.random().toString(36).substr(2, 20)}`,
      name: newOrg.name || 'New Organization',
      type: newOrg.type || 'HealthSystem',
      city: newOrg.city,
      state: newOrg.state,
      children: [],
    }
    setOrganizations([...organizations, org])
    setSelectedOrg(org)
    setShowCreateOrgModal(false)
  }

  const handleAddChildOrg = (childOrg: Partial<Organization>) => {
    if (!selectedOrg) return

    const newChild: Organization = {
      id: `org_${Math.random().toString(36).substr(2, 20)}`,
      name: childOrg.name || 'New Child Org',
      type: childOrg.type || 'LargeProviderGroup',
      parentId: selectedOrg.id,
      children: [],
    }

    const addChild = (org: Organization): Organization => {
      if (org.id === selectedOrg.id) {
        return { ...org, children: [...(org.children || []), newChild] }
      }
      if (org.children) {
        return { ...org, children: org.children.map(addChild) }
      }
      return org
    }

    setOrganizations(organizations.map(addChild))
    setSelectedOrg({ ...selectedOrg, children: [...(selectedOrg.children || []), newChild] })
    setExpandedOrgs(prev => new Set([...prev, selectedOrg.id]))
    setShowAddChildModal(false)
  }

  const findParentOrg = (orgId: string): Organization | null => {
    const search = (orgs: Organization[], parent: Organization | null): Organization | null => {
      for (const org of orgs) {
        if (org.id === orgId) return parent
        if (org.children) {
          const found = search(org.children, org)
          if (found !== undefined) return found
        }
      }
      return null
    }
    return search(organizations, null)
  }

  const parentOrg = selectedOrg ? findParentOrg(selectedOrg.id) : null

  // Count all items (orgs + practices) for display
  const countAllItems = (org: Organization): number => {
    let count = 1 + getPracticesForOrg(org.id).length
    org.children?.forEach(child => {
      count += countAllItems(child)
    })
    return count
  }

  // Render tree node
  const renderOrgNode = (org: Organization, level: number = 0, isUltimateParent: boolean = false) => {
    const hasChildren = (org.children && org.children.length > 0) || getPracticesForOrg(org.id).length > 0
    const isExpanded = expandedOrgs.has(org.id)
    const isSelected = selectedOrg?.id === org.id
    const orgPractices = getPracticesForOrg(org.id)

    return (
      <div key={org.id} className="tree-node">
        <div
          className={`tree-row ${isSelected ? 'selected' : ''} ${isUltimateParent ? 'ultimate-parent' : ''}`}
          onClick={() => handleSelectOrg(org)}
        >
          <div className="tree-expand" style={{ marginLeft: level * 24 }}>
            {hasChildren ? (
              <button className="expand-btn" onClick={(e) => toggleExpand(org.id, e)}>
                {isExpanded ? '▼' : '▶'}
              </button>
            ) : (
              <span className="expand-placeholder" />
            )}
          </div>
          <div className="tree-icon">
            {isUltimateParent ? '🏛️' : '🏢'}
          </div>
          <div className="tree-name">{org.name}</div>
          <div className="tree-type">
            <span className={`type-badge ${isUltimateParent ? 'ultimate' : 'child'}`}>
              {org.type}
            </span>
          </div>
          <div className="tree-id">{org.id}</div>
        </div>

        {isExpanded && (
          <div className="tree-children">
            {/* Child orgs */}
            {org.children?.map(child => renderOrgNode(child, level + 1, false))}

            {/* Practices under this org */}
            {orgPractices.map(practice => (
              <div
                key={practice.id}
                className={`tree-row practice-row ${selectedPractice?.id === practice.id ? 'selected' : ''}`}
                onClick={() => setSelectedPractice(practice)}
              >
                <div className="tree-expand" style={{ marginLeft: (level + 1) * 24 }}>
                  <span className="expand-placeholder" />
                </div>
                <div className="tree-icon">🏥</div>
                <div className="tree-name practice-name">{practice.name}</div>
                <div className="tree-type">
                  <span className="type-badge practice">Practice</span>
                </div>
                <div className="tree-id">{practice.id}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const selectedOrgPractices = selectedOrg ? getAllPracticesForOrg(selectedOrg) : []

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">Z</div>
          <span>Zocdoc</span>
        </div>
        <nav className="nav">
          <span className="nav-item">Home</span>
          <span className="nav-item active">Org Management</span>
          <span className="nav-item">Providers</span>
        </nav>
        <div className="header-right">
          <span className="nav-item">Internal user</span>
        </div>
      </header>

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Organization Management</h1>
          <div className="page-actions">
            <button className="btn btn-outline" onClick={() => setShowCreateOrgModal(true)}>
              + New Ultimate Parent Org
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Search Bar */}
        <div className="top-bar">
          <div className="search-section">
            <label>Search</label>
            <div className="search-wrapper">
              <input
                type="text"
                placeholder="Search Org by Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && searchResults.length > 0 && (
                <div className="search-dropdown">
                  {searchResults.map(org => (
                    <div
                      key={org.id}
                      className="search-result"
                      onClick={() => handleSelectOrg(org)}
                    >
                      <span className="result-name">{org.name}</span>
                      <span className="result-type">{org.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="results-section">
            <label>Results</label>
            <select
              value={resultType}
              onChange={(e) => setResultType(e.target.value as 'organizations' | 'practices')}
            >
              <option value="organizations">Organizations</option>
              <option value="practices">Practices</option>
            </select>
          </div>
        </div>

        {/* Organization Content */}
        {selectedOrg ? (
          <div className="hierarchy-section">
            <div className="hierarchy-header">
              <h2>Edit Organization Hierarchy</h2>
              <div className="org-ids">
                <span>Organization ID: {selectedOrg.id}</span>
                <span>Parent Organization ID: {parentOrg?.id || selectedOrg.id}</span>
              </div>
            </div>

            <div className="panels">
              {/* Left Panel - Tree View */}
              <div className="panel panel-tree">
                <div className="tree-header">
                  <div className="tree-col">name</div>
                  <div className="tree-col">type</div>
                  <div className="tree-col">id</div>
                </div>
                <div className="tree-body">
                  {renderOrgNode(selectedOrg, 0, !parentOrg)}
                </div>
                <div className="table-footer">
                  <span>Showing {countAllItems(selectedOrg)} items</span>
                </div>

                <div className="action-buttons">
                  <button className="btn btn-action" onClick={() => setShowAddPracticeModal(true)}>
                    Add Practices to Organization
                  </button>
                  <button className="btn btn-action" onClick={() => setShowChangeParentModal(true)}>
                    Change Parent for Organization
                  </button>
                  <button className="btn btn-action" onClick={() => setShowAddChildModal(true)}>
                    Add Child Organization
                  </button>
                  <button className="btn btn-action" onClick={() => setShowEditOrgModal(true)}>
                    Update Organization Name/Type
                  </button>
                </div>
              </div>

              {/* Right Panel - Practices */}
              <div className="panel panel-practices">
                <h3>Current Practices</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Num Active Providers</th>
                      <th>Monolit...</th>
                      <th>CloudId</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrgPractices.length > 0 ? (
                      selectedOrgPractices.map(practice => (
                        <tr
                          key={practice.id}
                          className={selectedPractice?.id === practice.id ? 'selected-row' : ''}
                          onClick={() => setSelectedPractice(practice)}
                        >
                          <td className="link">{practice.name}</td>
                          <td>{practice.numActiveProviders}</td>
                          <td>{practice.npi}</td>
                          <td>{practice.cloudId}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="empty">No practices</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="table-footer">
                  <span>Showing {selectedOrgPractices.length > 0 ? `1-${selectedOrgPractices.length}` : '0'} of {selectedOrgPractices.length}</span>
                </div>

                <div className="action-buttons">
                  <button
                    className="btn btn-action-secondary"
                    disabled={!selectedPractice}
                  >
                    Move Practice to New Organization
                  </button>
                  <button
                    className="btn btn-action-secondary"
                    disabled={!selectedPractice}
                  >
                    Remove Practice from Organization
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <h2>Search for an organization</h2>
            <p>Or create a new ultimate parent organization to get started</p>
          </div>
        )}
      </div>

      {/* Create Org Modal */}
      {showCreateOrgModal && (
        <Modal title="Create New Ultimate Parent Organization" onClose={() => setShowCreateOrgModal(false)}>
          <OrgForm
            onSubmit={handleCreateOrg}
            onCancel={() => setShowCreateOrgModal(false)}
            submitLabel="Create Organization"
            isUltimateParent={true}
          />
        </Modal>
      )}

      {/* Add Child Org Modal */}
      {showAddChildModal && selectedOrg && (
        <Modal title={`Add Child Organization to ${selectedOrg.name}`} onClose={() => setShowAddChildModal(false)}>
          <OrgForm
            onSubmit={handleAddChildOrg}
            onCancel={() => setShowAddChildModal(false)}
            submitLabel="Add Child Organization"
            isUltimateParent={false}
          />
        </Modal>
      )}

      {/* Edit Org Modal */}
      {showEditOrgModal && selectedOrg && (
        <Modal title="Update Organization" onClose={() => setShowEditOrgModal(false)}>
          <OrgForm
            initialValues={selectedOrg}
            onSubmit={(updated) => {
              const updateOrg = (org: Organization): Organization => {
                if (org.id === selectedOrg.id) return { ...org, ...updated }
                if (org.children) return { ...org, children: org.children.map(updateOrg) }
                return org
              }
              setOrganizations(organizations.map(updateOrg))
              setSelectedOrg({ ...selectedOrg, ...updated })
              setShowEditOrgModal(false)
            }}
            onCancel={() => setShowEditOrgModal(false)}
            submitLabel="Update Organization"
          />
        </Modal>
      )}

      {/* Add Practice Modal */}
      {showAddPracticeModal && selectedOrg && (
        <Modal title={`Add Practice to ${selectedOrg.name}`} onClose={() => setShowAddPracticeModal(false)}>
          <PracticeForm
            onSubmit={() => setShowAddPracticeModal(false)}
            onCancel={() => setShowAddPracticeModal(false)}
          />
        </Modal>
      )}

      {/* Change Parent Modal */}
      {showChangeParentModal && selectedOrg && (
        <Modal title="Change Parent Organization" onClose={() => setShowChangeParentModal(false)}>
          <div className="form-group">
            <label>Current Organization</label>
            <input type="text" value={selectedOrg.name} disabled />
          </div>
          <div className="form-group">
            <label>New Parent Organization</label>
            <select>
              <option value="">Select parent...</option>
              {allOrgs.filter(o => o.id !== selectedOrg.id).map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowChangeParentModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setShowChangeParentModal(false)}>Change Parent</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// Modal Component
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}

// Org Form Component
function OrgForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
  isUltimateParent = false
}: {
  initialValues?: Partial<Organization>
  onSubmit: (org: Partial<Organization>) => void
  onCancel: () => void
  submitLabel: string
  isUltimateParent?: boolean
}) {
  const [name, setName] = useState(initialValues?.name || '')
  const [type, setType] = useState(initialValues?.type || (isUltimateParent ? 'HealthSystem' : 'LargeProviderGroup'))

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, type }) }}>
      <div className="form-group">
        <label>Organization Name *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter organization name"
          required
          autoFocus
        />
      </div>
      <div className="form-group">
        <label>Organization Type *</label>
        <select value={type} onChange={e => setType(e.target.value as Organization['type'])}>
          <option value="HealthSystem">Health System</option>
          <option value="LargeProviderGroup">Large Provider Group</option>
          <option value="MidMarket">Mid-Market</option>
          <option value="Local">Local</option>
        </select>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={!name.trim()}>{submitLabel}</button>
      </div>
    </form>
  )
}

// Practice Form Component
function PracticeForm({ onSubmit, onCancel }: { onSubmit: () => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [npi, setNpi] = useState('')

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }}>
      <div className="form-group">
        <label>Practice Name *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter practice name"
          required
          autoFocus
        />
      </div>
      <div className="form-group">
        <label>NPI Number</label>
        <input
          type="text"
          value={npi}
          onChange={e => setNpi(e.target.value)}
          placeholder="Enter NPI"
        />
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={!name.trim()}>Add Practice</button>
      </div>
    </form>
  )
}

export default App

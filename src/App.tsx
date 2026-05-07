import { useState } from 'react'
import { Organization, Practice, ProductType } from './types'
import { mockOrganizations } from './data/mockData'

// Type abbreviations
const TYPE_ABBREV: Record<string, string> = {
  'HealthSystem': 'HS',
  'LargeProviderGroup': 'LPG',
  'MidMarket': 'MM',
  'Local': 'Local',
}

// Available products for practices
const AVAILABLE_PRODUCTS: { value: ProductType; label: string }[] = [
  { value: 'Marketplace', label: 'Marketplace' },
  { value: 'BookFromGoogle', label: 'Book from Google' },
  { value: 'Wellhive', label: 'Wellhive' },
  { value: 'Yelp', label: 'Yelp' },
  { value: 'Healthgrades', label: 'Healthgrades' },
  { value: 'ZVS', label: 'ZVS' },
  { value: 'Intake', label: 'Intake' },
  { value: 'Zo', label: 'Zo' },
  { value: 'BookableDirectory', label: 'Bookable Directory' },
]

type ViewMode = 'org-management' | 'workflow-comparison'

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('org-management')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState(mockOrganizations)
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set(['org-1']))
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [practices, setPractices] = useState<Practice[]>([
    { id: 'p1', name: 'Northwell Health Practice', npi: '174562', numActiveProviders: 0, cloudId: 'pL_nexM-oM58Eamot1thGiH8g', parentOrgId: 'org-1' },
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

  const handleSelectOrg = (org: Organization) => {
    setSelectedOrg(org)
    setSelectedItems(new Set([org.id]))
    setSearchQuery('')
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

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedItems(prev => {
      if (prev.has(id)) {
        return new Set()
      } else {
        return new Set([id])
      }
    })
  }

  const handleCreateOrg = (newOrg: Partial<Organization>) => {
    const org: Organization = {
      id: newOrg.id || `org_${Math.random().toString(36).substr(2, 12)}`,
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

  const handleAddPractice = (practice: { name: string; products?: ProductType[] }) => {
    if (!selectedOrg) return

    const targetOrgId = selectedItems.size === 1
      ? Array.from(selectedItems)[0]
      : selectedOrg.id

    const newPractice: Practice = {
      id: `p_${Math.random().toString(36).substr(2, 12)}`,
      name: practice.name,
      parentOrgId: targetOrgId,
      products: practice.products,
    }

    setPractices([...practices, newPractice])
    setExpandedOrgs(prev => new Set([...prev, targetOrgId]))
    setShowAddPracticeModal(false)
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

  const getOrgPath = (orgId: string): Organization[] => {
    const path: Organization[] = []
    const search = (orgs: Organization[], currentPath: Organization[]): boolean => {
      for (const org of orgs) {
        const newPath = [...currentPath, org]
        if (org.id === orgId) {
          path.push(...newPath)
          return true
        }
        if (org.children && search(org.children, newPath)) {
          return true
        }
      }
      return false
    }
    search(organizations, [])
    return path
  }

  const getTargetOrgForPractice = (): Organization | null => {
    if (selectedItems.size === 1) {
      const targetId = Array.from(selectedItems)[0]
      return allOrgs.find(o => o.id === targetId) || null
    }
    return selectedOrg
  }

  const parentOrg = selectedOrg ? findParentOrg(selectedOrg.id) : null

  // Count all items
  const countAllItems = (org: Organization): number => {
    let count = 1 + getPracticesForOrg(org.id).length
    org.children?.forEach(child => {
      count += countAllItems(child)
    })
    return count
  }

  // Get selected item type for action bar context
  const getSelectedType = (): 'org' | 'practice' | 'mixed' | 'none' => {
    if (selectedItems.size === 0) return 'none'
    const hasOrg = Array.from(selectedItems).some(id => id.startsWith('org'))
    const hasPractice = Array.from(selectedItems).some(id => id.startsWith('p'))
    if (hasOrg && hasPractice) return 'mixed'
    if (hasOrg) return 'org'
    return 'practice'
  }

  const selectedType = getSelectedType()

  // Render tree node
  const renderOrgNode = (org: Organization, level: number = 0, isUltimateParent: boolean = false) => {
    const hasChildren = (org.children && org.children.length > 0) || getPracticesForOrg(org.id).length > 0
    const isExpanded = expandedOrgs.has(org.id)
    const isSelected = selectedItems.has(org.id)
    const orgPractices = getPracticesForOrg(org.id)

    return (
      <div key={org.id} className="tree-node">
        <div
          className={`tree-row ${isSelected ? 'checked' : ''} ${isUltimateParent ? 'ultimate-parent' : ''}`}
          onClick={() => setSelectedItems(new Set([org.id]))}
        >
          <div className="tree-select">
            <input
              type="radio"
              name="tree-select"
              checked={isSelected}
              onChange={() => {}}
              onClick={(e) => toggleSelect(org.id, e)}
            />
          </div>
          <div className="tree-expand">
            {hasChildren ? (
              <button className="expand-btn" onClick={(e) => toggleExpand(org.id, e)}>
                {isExpanded ? '▼' : '▶'}
              </button>
            ) : (
              <span className="expand-placeholder" />
            )}
          </div>
          <div className="tree-name" style={{ paddingLeft: level * 24 }}>{org.name}</div>
          <div className="tree-type">
            <span className={`type-badge ${isUltimateParent ? 'ultimate' : 'child'}`}>
              {TYPE_ABBREV[org.type] || org.type}
            </span>
          </div>
          <div className="tree-id">{org.id}</div>
        </div>

        {isExpanded && (
          <div className="tree-children">
            {org.children?.map(child => renderOrgNode(child, level + 1, false))}
            {orgPractices.map(practice => (
              <div
                key={practice.id}
                className={`tree-row practice-row ${selectedItems.has(practice.id) ? 'checked' : ''}`}
                onClick={() => setSelectedItems(new Set([practice.id]))}
              >
                <div className="tree-select">
                  <input
                    type="radio"
                    name="tree-select"
                    checked={selectedItems.has(practice.id)}
                    onChange={() => {}}
                    onClick={(e) => toggleSelect(practice.id, e)}
                  />
                </div>
                <div className="tree-expand">
                  <span className="expand-placeholder" />
                </div>
                <div className="tree-name practice-name" style={{ paddingLeft: (level + 1) * 24 }}>{practice.name}</div>
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
            {viewMode === 'org-management' && (
              <button className="btn btn-outline" onClick={() => setShowCreateOrgModal(true)}>
                + Create New Client
              </button>
            )}
          </div>
        </div>
        {/* View Tabs */}
        <div className="view-tabs">
          <button
            className={`view-tab ${viewMode === 'org-management' ? 'active' : ''}`}
            onClick={() => setViewMode('org-management')}
          >
            Org Hierarchy
          </button>
          <button
            className={`view-tab ${viewMode === 'workflow-comparison' ? 'active' : ''}`}
            onClick={() => setViewMode('workflow-comparison')}
          >
            Workflow Comparison
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {viewMode === 'workflow-comparison' && <WorkflowComparison />}
        {viewMode === 'org-management' && (
        <>
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
                      <span className="result-type">{TYPE_ABBREV[org.type]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Organization Content */}
        {selectedOrg ? (
          <div className="hierarchy-section">
            <div className="hierarchy-header">
              <div className="hierarchy-info">
                <h2>Edit Organization Hierarchy</h2>
                <div className="org-ids">
                  <span>Organization ID: {selectedOrg.id}</span>
                  <span>Parent Organization ID: {parentOrg?.id || selectedOrg.id}</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="action-bar">
              <div className="action-bar-left">
                {selectedItems.size > 0 && (
                  <span className="selection-count">1 item selected</span>
                )}
              </div>
              <div className="action-bar-right">
                <button
                  className="btn btn-action-bar"
                  onClick={() => setShowAddPracticeModal(true)}
                  disabled={selectedType !== 'org' && selectedType !== 'none'}
                >
                  Add Practice
                </button>
                <button
                  className="btn btn-action-bar"
                  onClick={() => setShowAddChildModal(true)}
                  disabled={selectedType !== 'org' && selectedType !== 'none'}
                >
                  Add Child Org
                </button>
                <button
                  className="btn btn-action-bar"
                  onClick={() => setShowChangeParentModal(true)}
                  disabled={selectedItems.size === 0}
                >
                  Change Parent
                </button>
                <button
                  className="btn btn-action-bar"
                  onClick={() => setShowEditOrgModal(true)}
                  disabled={selectedItems.size !== 1}
                >
                  Edit
                </button>
                <button
                  className="btn btn-action-bar btn-danger"
                  disabled={selectedItems.size === 0}
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Tree View */}
            <div className="tree-container">
              <div className="tree-header">
                <div className="tree-col tree-col-select"></div>
                <div className="tree-col tree-col-expand"></div>
                <div className="tree-col tree-col-name">name</div>
                <div className="tree-col tree-col-type">type</div>
                <div className="tree-col tree-col-id">id</div>
              </div>
              <div className="tree-body">
                {renderOrgNode(selectedOrg, 0, !parentOrg)}
              </div>
              <div className="tree-footer">
                <span>Showing {countAllItems(selectedOrg)} items</span>
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
        </>
        )}
      </div>

      {/* Create New Client Wizard */}
      {showCreateOrgModal && (
        <CreateNewClientWizard
          onClose={() => setShowCreateOrgModal(false)}
          onCreateOrg={handleCreateOrg}
          onCreatePractice={(orgId, practice) => {
            const newPractice: Practice = {
              id: `p_${Math.random().toString(36).substr(2, 12)}`,
              name: practice.name,
              parentOrgId: orgId,
              products: practice.products,
            }
            setPractices([...practices, newPractice])
            setExpandedOrgs(prev => new Set([...prev, orgId]))
          }}
        />
      )}

      {/* Add Child Org Wizard */}
      {showAddChildModal && selectedOrg && (() => {
        const targetOrg = getTargetOrgForPractice() || selectedOrg
        const orgPath = getOrgPath(targetOrg.id)
        return (
          <AddChildOrgWizard
            parentOrg={targetOrg}
            orgPath={orgPath}
            onClose={() => setShowAddChildModal(false)}
            onCreateOrg={(childOrg) => {
              const newChild: Organization = {
                id: childOrg.id || `org_${Math.random().toString(36).substr(2, 12)}`,
                name: childOrg.name || 'New Child Org',
                type: childOrg.type || 'LargeProviderGroup',
                parentId: targetOrg.id,
                children: [],
              }

              const addChild = (org: Organization): Organization => {
                if (org.id === targetOrg.id) {
                  return { ...org, children: [...(org.children || []), newChild] }
                }
                if (org.children) {
                  return { ...org, children: org.children.map(addChild) }
                }
                return org
              }

              const updatedOrgs = organizations.map(addChild)
              setOrganizations(updatedOrgs)

              // Update selectedOrg to reflect changes (including nested children)
              const findOrg = (orgs: Organization[], id: string): Organization | null => {
                for (const org of orgs) {
                  if (org.id === id) return org
                  if (org.children) {
                    const found = findOrg(org.children, id)
                    if (found) return found
                  }
                }
                return null
              }
              const updatedSelectedOrg = findOrg(updatedOrgs, selectedOrg.id)
              if (updatedSelectedOrg) {
                setSelectedOrg(updatedSelectedOrg)
              }

              setExpandedOrgs(prev => new Set([...prev, targetOrg.id]))
              setShowAddChildModal(false)
            }}
            onCreatePractice={(orgId, practice) => {
              const newPractice: Practice = {
                id: `p_${Math.random().toString(36).substr(2, 12)}`,
                name: practice.name,
                parentOrgId: orgId,
                products: practice.products,
              }
              setPractices([...practices, newPractice])
              setExpandedOrgs(prev => new Set([...prev, orgId]))
            }}
          />
        )
      })()}

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
      {showAddPracticeModal && selectedOrg && (() => {
        const targetOrg = getTargetOrgForPractice()
        const orgPath = targetOrg ? getOrgPath(targetOrg.id) : []
        return (
          <AddPracticeModal
            parentOrg={targetOrg}
            orgPath={orgPath}
            onClose={() => setShowAddPracticeModal(false)}
            onCreatePractice={handleAddPractice}
          />
        )
      })()}

      {/* Change Parent Modal */}
      {showChangeParentModal && selectedOrg && (
        <Modal title="Change Parent Organization" onClose={() => setShowChangeParentModal(false)}>
          <div className="form-group">
            <label>Selected Items</label>
            <input type="text" value={`${selectedItems.size} item(s) selected`} disabled />
          </div>
          <div className="form-group">
            <label>New Parent Organization</label>
            <select>
              <option value="">Select parent...</option>
              {allOrgs.filter(o => !selectedItems.has(o.id)).map(org => (
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
    <div className="modal-overlay">
      <div className="modal">
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
          <option value="HealthSystem">Health System (HS)</option>
          <option value="LargeProviderGroup">Large Provider Group (LPG)</option>
          <option value="MidMarket">Mid-Market (MM)</option>
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

// Add Practice Modal Component
function AddPracticeModal({
  parentOrg,
  orgPath = [],
  onClose,
  onCreatePractice,
}: {
  parentOrg?: Organization | null
  orgPath?: Organization[]
  onClose: () => void
  onCreatePractice: (data: { name: string; products?: ProductType[] }) => void
}) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [name, setName] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<ProductType[]>([])

  const toggleProduct = (product: ProductType) => {
    setSelectedProducts(prev =>
      prev.includes(product)
        ? prev.filter(p => p !== product)
        : [...prev, product]
    )
  }

  const handleCreate = () => {
    onCreatePractice({
      name,
      products: selectedProducts.length > 0 ? selectedProducts : undefined
    })
    setShowSuccess(true)
  }

  if (showSuccess) {
    return (
      <div className="modal-overlay">
        <div className="modal new-client-wizard">
          <div className="modal-header">
            <h2>Add Practice</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="wizard-content wizard-success">
              <div className="success-icon">✓</div>
              <h3>Practice Created!</h3>
              <div className="success-summary">
                <div className="success-detail">
                  <label>Parent Organization</label>
                  <span>{parentOrg?.name || 'N/A'}</span>
                </div>
                <div className="success-divider" />
                <div className="success-detail">
                  <label>Practice</label>
                  <span>{name}</span>
                </div>
                {selectedProducts.length > 0 && (
                  <div className="success-detail">
                    <label>Products</label>
                    <span>{selectedProducts.join(', ')}</span>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={onClose}>Done</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay">
      <div className="modal new-client-wizard wide-modal">
        <div className="modal-header">
          <h2>Add Practice</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body split-view">
          {/* Left: Hierarchy Preview */}
          <div className="split-left">
            <div className="org-hierarchy-preview">
              <div className="hierarchy-preview-title">Organization Hierarchy</div>
              <div className="hierarchy-preview-tree">
                {orgPath.map((org, index) => (
                  <div key={org.id} style={{ marginLeft: index * 20 }}>
                    {index > 0 && <span className="hierarchy-connector">└─</span>}
                    <div className="hierarchy-node org-node" style={{ display: 'inline-flex', marginLeft: index > 0 ? 4 : 0 }}>
                      <span className="node-icon">🏢</span>
                      <span className="node-name">{org.name}</span>
                      <span className={`type-badge ${index === 0 ? 'ultimate' : 'child'}`}>
                        {TYPE_ABBREV[org.type] || org.type}
                      </span>
                    </div>
                  </div>
                ))}
                {/* New Practice */}
                <div style={{ marginLeft: orgPath.length * 20 }}>
                  <span className="hierarchy-connector">└─</span>
                  <div className="hierarchy-node practice-node new-practice" style={{ display: 'inline-flex', marginLeft: 4 }}>
                    <span className="node-icon">🏥</span>
                    <span className="node-name">{name || 'New Practice'}</span>
                    <span className="type-badge practice">Practice</span>
                    <span className="new-badge">← Creating here</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="split-right">
            <div className="form-section">
              <h4>Practice Details</h4>
              <div className="form-group">
                <label>Practice Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter practice name"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Products</label>
                <div className="product-checkboxes">
                  {AVAILABLE_PRODUCTS.map(product => (
                    <label key={product.value} className="product-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.value)}
                        onChange={() => toggleProduct(product.value)}
                      />
                      <span>{product.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!name.trim()}
          >
            Add Practice
          </button>
        </div>
      </div>
    </div>
  )
}

// Workflow Comparison Component
function WorkflowComparison() {
  const [showCurrentDemo, setShowCurrentDemo] = useState(false)
  const [showProposedDemo, setShowProposedDemo] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['create-org', 'locking']))

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  return (
    <div className="workflow-comparison-container">
      <div className="comparison-intro">
        <h2>Workflow Comparison: Current vs Proposed</h2>
        <p>Compare how organization management works today versus the proposed unified approach.</p>
      </div>

      {/* Section 1: Creating Organizations */}
      <div className="scenario-accordion">
        <button className="accordion-header" onClick={() => toggleSection('create-org')}>
          <div className="accordion-title">
            <h3>Creating Organizations</h3>
            <p>New organization or child org under an existing client</p>
          </div>
          <span className="accordion-icon">{expandedSections.has('create-org') ? '−' : '+'}</span>
        </button>
        {expandedSections.has('create-org') && (
          <div className="accordion-content">
            <div className="workflow-row current">
              <span className="workflow-badge current">Current</span>
              <div className="workflow-steps-inline">
                <div className="inline-step">
                  <span className="step-num">1</span>
                  <div className="step-info">
                    <strong>Create Account in Salesforce</strong>
                    <span className="step-system">Salesforce</span>
                  </div>
                </div>
                <span className="step-arrow-inline">→</span>
                <div className="inline-step">
                  <span className="step-num">2</span>
                  <div className="step-info">
                    <strong>Create Strategic Contact</strong>
                    <span className="step-system">Salesforce</span>
                  </div>
                </div>
                <span className="step-arrow-inline">→</span>
                <div className="inline-step">
                  <span className="step-num">3</span>
                  <div className="step-info">
                    <strong>Create Account in CSR</strong>
                    <span className="step-system">CSR (Retool)</span>
                  </div>
                </div>
              </div>
              <button className="btn btn-demo-current" onClick={() => setShowCurrentDemo(true)}>
                View Demo
              </button>
            </div>
            <div className="workflow-row proposed">
              <span className="workflow-badge proposed">Proposed</span>
              <div className="workflow-steps-inline">
                <div className="inline-step">
                  <span className="step-num">1</span>
                  <div className="step-info">
                    <strong>Create Prospect</strong>
                    <span className="step-system">Salesforce</span>
                  </div>
                </div>
                <span className="step-arrow-inline">→</span>
                <div className="inline-step">
                  <span className="step-num">2</span>
                  <div className="step-info">
                    <strong>Convert to Client/Product Account</strong>
                    <span className="step-system">Product Tool</span>
                  </div>
                </div>
              </div>
              <button className="btn btn-demo-proposed" onClick={() => setShowProposedDemo(true)}>
                View Demo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Hierarchy Locking Rules */}
      <div className="scenario-accordion">
        <button className="accordion-header" onClick={() => toggleSection('locking')}>
          <div className="accordion-title">
            <h3>Hierarchy Locking Rules</h3>
            <p>How hierarchy changes are controlled after CSR account creation</p>
          </div>
          <span className="accordion-icon">{expandedSections.has('locking') ? '−' : '+'}</span>
        </button>
        {expandedSections.has('locking') && (
          <div className="accordion-content">
            <div className="workflow-row current">
              <span className="workflow-badge current">Current</span>
              <div className="locking-rules-inline">
                <div className="rule-summary">
                  <span className="rule-icon">🔒</span>
                  <strong>Full Lock on Conversion</strong>
                  <span className="rule-desc">— Entire hierarchy locked in Salesforce once in CSR</span>
                </div>
                <div className="rule-issues">
                  <span className="issue-item"><span className="issue-icon">⚠️</span> No restructuring possible</span>
                  <span className="issue-item"><span className="issue-icon">⚠️</span> Requires engineering to change</span>
                </div>
              </div>
              <button className="btn btn-demo-current" onClick={() => setShowCurrentDemo(true)}>
                View Demo
              </button>
            </div>
            <div className="workflow-row proposed">
              <span className="workflow-badge proposed">Proposed</span>
              <div className="locking-rules-inline">
                <div className="rule-summary">
                  <span className="rule-icon">🔐</span>
                  <strong>Controlled Hierarchy Changes</strong>
                </div>
                <div className="rule-details">
                  <span className="blocked-item"><span className="blocked-icon">✗</span> Hierarchy changes blocked if org has CSR account or child with CSR</span>
                </div>
                <div className="rule-details">
                  <span className="allowed-item"><span className="allowed-icon">✓</span> "Change Parent" button at account level for controlled changes</span>
                </div>
                <div className="rule-details">
                  <span className="blocked-item"><span className="blocked-icon">✗</span> Cannot add child org under a prospect (must convert to CSR first)</span>
                </div>
                <div className="rule-details">
                  <span className="blocked-item"><span className="blocked-icon">✗</span> Account segment changes not allowed at child level</span>
                </div>
              </div>
              <button className="btn btn-demo-proposed" onClick={() => setShowProposedDemo(true)}>
                View Demo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Demo Modals */}
      {showCurrentDemo && (
        <CurrentWorkflowDemo onClose={() => setShowCurrentDemo(false)} />
      )}
      {showProposedDemo && (
        <CommercialTeamDemo onClose={() => setShowProposedDemo(false)} />
      )}
    </div>
  )
}

// Current Workflow Demo Modal
function CurrentWorkflowDemo({ onClose }: { onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      system: 'Salesforce',
      title: 'Create Account',
      images: [
        { src: `${import.meta.env.BASE_URL}images/workflow/step1a-accounts-list.png`, caption: '1a: Click "New" on Accounts list' },
        { src: `${import.meta.env.BASE_URL}images/workflow/step1b-select-type.png`, caption: '1b: Select account type' },
        { src: `${import.meta.env.BASE_URL}images/workflow/step1c-account-form.png`, caption: '1c: Fill account form' }
      ]
    },
    {
      system: 'Salesforce',
      title: 'Create Strategic Contact',
      images: [
        { src: `${import.meta.env.BASE_URL}images/workflow/step2a-related-tab.png`, caption: '2a: Go to Related tab' },
        { src: `${import.meta.env.BASE_URL}images/workflow/step2b-contacts.png`, caption: '2b: Click Contacts' },
        { src: `${import.meta.env.BASE_URL}images/workflow/step2c-new-contact.png`, caption: '2c: Click New' },
        { src: `${import.meta.env.BASE_URL}images/workflow/step2d-record-type.png`, caption: '2d: Select Strategic record type' },
        { src: `${import.meta.env.BASE_URL}images/workflow/step2e-contact-form.png`, caption: '2e: Fill contact details' }
      ]
    },
    {
      system: 'CSR (Retool)',
      title: 'Create Account in CSR',
      images: [
        { src: `${import.meta.env.BASE_URL}images/workflow/step3a-copy-url.png`, caption: '3a: Copy Classic URL from Salesforce' },
        { src: `${import.meta.env.BASE_URL}images/workflow/step3b-csr-signup.png`, caption: '3b: Paste URL and Sign Up' }
      ]
    }
  ]

  const allImages = steps.flatMap((step, stepIdx) =>
    step.images.map((img) => ({
      ...img,
      stepNumber: stepIdx + 1,
      stepTitle: step.title,
      system: step.system,
    }))
  )

  const currentImage = allImages[currentStep]
  const totalSteps = allImages.length

  return (
    <div className="demo-overlay" onClick={onClose}>
      <div className="demo-modal" onClick={e => e.stopPropagation()}>
        <div className="demo-header">
          <div className="demo-progress">
            <div className="demo-progress-bar">
              <div
                className="demo-progress-fill"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
            <span className="demo-progress-text">
              Step {currentStep + 1} of {totalSteps}
            </span>
          </div>
          <button className="demo-close" onClick={onClose}>×</button>
        </div>

        <div className="demo-content">
          <div className="demo-sidebar">
            <div className="demo-nav-title">Current Workflow</div>
            {steps.map((step, idx) => {
              const stepStartIdx = allImages.findIndex(img => img.stepNumber === idx + 1)
              const isCurrentStep = currentImage?.stepNumber === idx + 1
              return (
                <div
                  key={idx}
                  className={`demo-nav-item ${isCurrentStep ? 'active' : ''}`}
                  onClick={() => setCurrentStep(stepStartIdx)}
                >
                  <div className="demo-nav-number">{idx + 1}</div>
                  <div className="demo-nav-info">
                    <div className="demo-nav-label">{step.title}</div>
                    <div className="demo-nav-system">{step.system}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="demo-main">
            <div className="demo-step-header">
              <span className={`demo-system-badge ${currentImage?.system.toLowerCase().replace(/[^a-z]/g, '')}`}>
                {currentImage?.system}
              </span>
              <span className="demo-step-name">{currentImage?.stepTitle}</span>
            </div>
            <div className="demo-image-container">
              <img
                src={currentImage?.src}
                alt={currentImage?.caption}
                className="demo-image"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
            <div className="demo-caption">{currentImage?.caption}</div>
          </div>
        </div>

        <div className="demo-footer">
          <button
            className="demo-nav-btn prev"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 0}
          >
            ← Previous
          </button>
          <div className="demo-step-dots">
            {allImages.map((_, idx) => (
              <button
                key={idx}
                className={`demo-dot ${idx === currentStep ? 'active' : ''}`}
                onClick={() => setCurrentStep(idx)}
              />
            ))}
          </div>
          {currentStep < totalSteps - 1 ? (
            <button className="demo-nav-btn next" onClick={() => setCurrentStep(prev => prev + 1)}>
              Next →
            </button>
          ) : (
            <button className="demo-nav-btn finish" onClick={onClose}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Add Child Org Wizard Component
// Add Child Org Component
function AddChildOrgWizard({
  parentOrg,
  orgPath,
  onClose,
  onCreateOrg,
  onCreatePractice,
}: {
  parentOrg: Organization
  orgPath: Organization[]
  onClose: () => void
  onCreateOrg: (org: Partial<Organization>) => void
  onCreatePractice: (orgId: string, practice: { name: string; products?: ProductType[] }) => void
}) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [addPractice, setAddPractice] = useState(false)
  const [practiceData, setPracticeData] = useState({
    name: '',
    products: [] as ProductType[],
  })

  const toggleProduct = (product: ProductType) => {
    setPracticeData(prev => {
      const products = prev.products.includes(product)
        ? prev.products.filter(p => p !== product)
        : [...prev.products, product]
      return { ...prev, products }
    })
  }

  const handleCreate = () => {
    const newOrgId = `org_${Math.random().toString(36).substr(2, 12)}`

    // Create the child org
    onCreateOrg({ name: orgName, id: newOrgId, type: 'LargeProviderGroup' } as Partial<Organization>)

    // Create practice if enabled
    if (addPractice && practiceData.name.trim()) {
      onCreatePractice(newOrgId, {
        name: practiceData.name,
        products: practiceData.products.length > 0 ? practiceData.products : undefined,
      })
    }

    setShowSuccess(true)
  }

  const canCreate = orgName.trim()

  if (showSuccess) {
    return (
      <div className="modal-overlay">
        <div className="modal new-client-wizard">
          <div className="modal-header">
            <h2>Add Child Organization</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="wizard-content wizard-success">
              <div className="success-icon">✓</div>
              <h3>Child Organization Created!</h3>
              <div className="success-summary">
                <div className="success-detail">
                  <label>Parent</label>
                  <span>{parentOrg.name}</span>
                </div>
                <div className="success-divider" />
                <div className="success-detail">
                  <label>Child Organization</label>
                  <span>{orgName}</span>
                </div>
                {addPractice && practiceData.name && (
                  <>
                    <div className="success-divider" />
                    <div className="success-detail">
                      <label>Practice</label>
                      <span>{practiceData.name}</span>
                    </div>
                    {practiceData.products.length > 0 && (
                      <div className="success-detail">
                        <label>Products</label>
                        <span>{practiceData.products.join(', ')}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={onClose}>Done</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay">
      <div className="modal new-client-wizard wide-modal">
        <div className="modal-header">
          <h2>Add Child Organization</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body split-view">
          {/* Left: Hierarchy Preview */}
          <div className="split-left">
            <div className="org-hierarchy-preview">
              <div className="hierarchy-preview-title">Organization Hierarchy</div>
              <div className="hierarchy-preview-tree">
                {orgPath.map((org, index) => (
                  <div key={org.id} className="hierarchy-row" style={{ paddingLeft: index * 20 }}>
                    {index > 0 && <span className="hierarchy-connector">└─</span>}
                    <div className="hierarchy-node org-node" style={{ display: 'inline-flex' }}>
                      <span className="node-icon">🏢</span>
                      <span className="node-name">{org.name}</span>
                      <span className={`type-badge ${index === 0 ? 'ultimate' : 'child'}`}>
                        {TYPE_ABBREV[org.type] || org.type}
                      </span>
                    </div>
                  </div>
                ))}
                {/* New Child Org */}
                <div className="hierarchy-row" style={{ paddingLeft: orgPath.length * 20 }}>
                  <span className="hierarchy-connector">└─</span>
                  <div className="hierarchy-node org-node new-practice" style={{ display: 'inline-flex' }}>
                    <span className="node-icon">🏢</span>
                    <span className="node-name">{orgName || 'New Child Org'}</span>
                    <span className="type-badge child">LPG</span>
                    {!addPractice && <span className="new-badge">← Creating here</span>}
                  </div>
                </div>
                {/* Practice under new child */}
                {addPractice && (
                  <div className="hierarchy-row" style={{ paddingLeft: (orgPath.length + 1) * 20 }}>
                    <span className="hierarchy-connector">└─</span>
                    <div className="hierarchy-node practice-node new-practice" style={{ display: 'inline-flex' }}>
                      <span className="node-icon">🏥</span>
                      <span className="node-name">{practiceData.name || 'New Practice'}</span>
                      <span className="type-badge practice">Practice</span>
                      <span className="new-badge">← Creating here</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="split-right">
            {/* Child Org Fields */}
            <div className="form-section">
              <h4>Child Organization</h4>
              <div className="form-group">
                <label>Organization Name *</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="Enter organization name"
                  autoFocus
                />
              </div>
            </div>

            {/* Practice Toggle & Fields */}
            <div className="form-section">
              <div className="form-group practice-toggle">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={addPractice}
                    onChange={e => setAddPractice(e.target.checked)}
                  />
                  <span>Add a practice under this organization</span>
                </label>
              </div>

              {addPractice && (
                <>
                  <div className="form-group">
                    <label>Practice Name *</label>
                    <input
                      type="text"
                      value={practiceData.name}
                      onChange={e => setPracticeData({ ...practiceData, name: e.target.value })}
                      placeholder="Enter practice name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Products</label>
                    <div className="product-checkboxes">
                      {AVAILABLE_PRODUCTS.map(product => (
                        <label key={product.value} className="product-checkbox">
                          <input
                            type="checkbox"
                            checked={practiceData.products.includes(product.value)}
                            onChange={() => toggleProduct(product.value)}
                          />
                          <span>{product.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!canCreate}
          >
            Add Child Org
          </button>
        </div>
      </div>
    </div>
  )
}

// Create New Client Wizard Component
function CreateNewClientWizard({
  onClose,
  onCreateOrg,
  onCreatePractice,
}: {
  onClose: () => void
  onCreateOrg: (org: Partial<Organization>) => void
  onCreatePractice: (orgId: string, practice: { name: string; products?: ProductType[] }) => void
}) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [orgData, setOrgData] = useState({
    name: '',
    type: 'HealthSystem' as Organization['type'],
  })
  const [addPractice, setAddPractice] = useState(false)
  const [practiceData, setPracticeData] = useState({
    name: '',
    products: [] as ProductType[],
  })

  const toggleProduct = (product: ProductType) => {
    setPracticeData(prev => {
      const products = prev.products.includes(product)
        ? prev.products.filter(p => p !== product)
        : [...prev.products, product]
      return { ...prev, products }
    })
  }

  const handleCreate = () => {
    const newOrgId = `org_${Math.random().toString(36).substr(2, 12)}`

    // Create the org
    onCreateOrg({ ...orgData, id: newOrgId } as Partial<Organization>)

    // Create practice if enabled and has name
    if (addPractice && practiceData.name.trim()) {
      onCreatePractice(newOrgId, {
        name: practiceData.name,
        products: practiceData.products.length > 0 ? practiceData.products : undefined,
      })
    }

    setShowSuccess(true)
  }

  const canCreate = orgData.name.trim() && (!addPractice || practiceData.name.trim())

  if (showSuccess) {
    return (
      <div className="modal-overlay">
        <div className="modal new-client-wizard">
          <div className="modal-header">
            <h2>Create New Client</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="wizard-content wizard-success">
              <div className="success-icon">✓</div>
              <h3>New Client Created Successfully!</h3>
              <div className="success-summary">
                <div className="success-detail">
                  <label>Organization</label>
                  <span>{orgData.name}</span>
                </div>
                <div className="success-detail">
                  <label>Segment</label>
                  <span>{TYPE_ABBREV[orgData.type] || orgData.type}</span>
                </div>
                {addPractice && practiceData.name && (
                  <>
                    <div className="success-divider" />
                    <div className="success-detail">
                      <label>Practice</label>
                      <span>{practiceData.name}</span>
                    </div>
                    {practiceData.products.length > 0 && (
                      <div className="success-detail">
                        <label>Products</label>
                        <span>{practiceData.products.join(', ')}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={onClose}>Done</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay">
      <div className="modal new-client-wizard wide-modal">
        <div className="modal-header">
          <h2>Create New Client</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body split-view">
          {/* Left: Hierarchy Preview */}
          <div className="split-left">
            <div className="org-hierarchy-preview">
              <div className="hierarchy-preview-title">Organization Hierarchy</div>
              <div className="hierarchy-preview-tree">
                {/* Parent Org */}
                <div className="hierarchy-node org-node">
                  <span className="node-icon">🏢</span>
                  <span className="node-name">{orgData.name || 'New Organization'}</span>
                  <span className="type-badge ultimate">{TYPE_ABBREV[orgData.type] || orgData.type}</span>
                </div>

                {/* Practice (if enabled) */}
                {addPractice && (
                  <div style={{ marginLeft: 20 }}>
                    <span className="hierarchy-connector">└─</span>
                    <div className="hierarchy-node practice-node new-practice" style={{ display: 'inline-flex', marginLeft: 4 }}>
                      <span className="node-icon">🏥</span>
                      <span className="node-name">{practiceData.name || 'New Practice'}</span>
                      <span className="type-badge practice">Practice</span>
                      <span className="new-badge">← Creating here</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="split-right">
            {/* Organization Fields */}
            <div className="form-section">
              <h4>Organization</h4>
              <div className="form-group">
                <label>Organization Name *</label>
                <input
                  type="text"
                  value={orgData.name}
                  onChange={e => setOrgData({ ...orgData, name: e.target.value })}
                  placeholder="Enter organization name"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Segment *</label>
                <select
                  value={orgData.type}
                  onChange={e => setOrgData({ ...orgData, type: e.target.value as Organization['type'] })}
                >
                  <option value="HealthSystem">Health System (HS)</option>
                  <option value="LargeProviderGroup">Large Provider Group (LPG)</option>
                  <option value="MidMarket">Mid-Market (MM)</option>
                  <option value="Local">Local</option>
                </select>
              </div>
            </div>

            {/* Practice Toggle & Fields */}
            <div className="form-section">
              <div className="form-group practice-toggle">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={addPractice}
                    onChange={e => setAddPractice(e.target.checked)}
                  />
                  <span>Add a practice under this organization</span>
                </label>
              </div>

              {addPractice && (
                <>
                  <div className="form-group">
                    <label>Practice Name *</label>
                    <input
                      type="text"
                      value={practiceData.name}
                      onChange={e => setPracticeData({ ...practiceData, name: e.target.value })}
                      placeholder="Enter practice name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Products</label>
                    <div className="product-checkboxes">
                      {AVAILABLE_PRODUCTS.map(product => (
                        <label key={product.value} className="product-checkbox">
                          <input
                            type="checkbox"
                            checked={practiceData.products.includes(product.value)}
                            onChange={() => toggleProduct(product.value)}
                          />
                          <span>{product.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!canCreate}
          >
            Create Client
          </button>
        </div>
      </div>
    </div>
  )
}

// Commercial Team Demo Component
type DemoStep = 'list' | 'type-modal' | 'form' | 'detail' | 'csr-org' | 'csr-practice' | 'success'
type AccountType = 'Practice' | 'BusinessDevelopment' | 'HealthSystem'
type CSRScenario = 'new-customer' | 'existing-no-parent-org' | 'existing-with-parent-org'

const MOCK_ACCOUNTS = [
  { id: 1, name: 'Lifestance - Texas', segment: 'Large Provider Group', practiceId: '118864', phone: '', website: '', state: 'TX', lastActivity: '6/19/2025', isActive: false },
  { id: 2, name: 'LifeStance [PARENT ACCOUNT]', segment: 'Large Provider Group', practiceId: '', phone: '(480) 52...', website: 'https://lif...', state: 'TX', lastActivity: '5/6/2026', isActive: false },
  { id: 3, name: 'Northwell Health Physician Partners Neurology', segment: 'Health System', practiceId: '107271', phone: '516-578...', website: '', state: 'NY', lastActivity: '4/29/2024', isActive: true },
  { id: 4, name: 'Privia Health', segment: 'Large Provider Group', practiceId: '', phone: '509-525...', website: 'https://w...', state: 'WA', lastActivity: '8/5/2022', isActive: false },
  { id: 5, name: 'Northwell Health', segment: 'Health System', practiceId: '01260000', phone: '(888) 32...', website: 'https://w...', state: 'NY', lastActivity: '12/9/2026', isActive: false },
  { id: 6, name: 'Cardiothoracic Surgery', segment: 'Health System', practiceId: '114849', phone: '718-226...', website: '', state: 'NY', lastActivity: '', isActive: false },
  { id: 7, name: 'Tava Health', segment: 'Local', practiceId: '137235', phone: '435-868...', website: '', state: 'UT', lastActivity: '', isActive: true },
  { id: 8, name: 'Orlando Health Physician Associates', segment: 'Health System', practiceId: '75919', phone: '', website: '', state: 'FL', lastActivity: '6/26/2023', isActive: true },
]

function CommercialTeamDemo({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<DemoStep>('list')
  const [selectedType, setSelectedType] = useState<AccountType>('HealthSystem')
  const [formData, setFormData] = useState({
    accountName: '',
    accountSegment: 'Health System',
    parentAccount: '',
    ultimateParentOrgId: '',
    parentOrgId: '',
    website: '',
    phone: '',
    territory: '',
  })
  const [searchQuery, setSearchQuery] = useState('')

  // CSR Wizard state
  const [csrScenario, setCsrScenario] = useState<CSRScenario>('new-customer')
  const [csrOrgData, setCsrOrgData] = useState({
    name: '',
    type: 'Health System',
  })
  const [csrPracticeData, setCsrPracticeData] = useState({
    name: '',
    npi: '',
    products: [] as string[],
  })
  const [createdOrgId, setCreatedOrgId] = useState('')

  const filteredAccounts = searchQuery
    ? MOCK_ACCOUNTS.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : MOCK_ACCOUNTS

  const getStepNumber = () => {
    switch (step) {
      case 'list': case 'type-modal': return 1
      case 'form': return 2
      case 'detail': case 'csr-org': case 'csr-practice': case 'success': return 3
    }
  }

  // Determine CSR scenario based on form data
  const determineCSRScenario = (): CSRScenario => {
    if (!formData.ultimateParentOrgId) {
      return 'new-customer'
    } else if (!formData.parentOrgId) {
      return 'existing-no-parent-org'
    } else {
      return 'existing-with-parent-org'
    }
  }

  const handleCreateCSRAccount = () => {
    const scenario = determineCSRScenario()
    setCsrScenario(scenario)
    // Pre-fill org data from account
    setCsrOrgData({
      name: formData.accountName || 'New Organization',
      type: formData.accountSegment,
    })
    setCsrPracticeData({
      name: formData.accountName ? `${formData.accountName} Practice` : 'New Practice',
      npi: '',
      products: [],
    })

    if (scenario === 'existing-with-parent-org') {
      // Skip org creation, go straight to practice
      setStep('csr-practice')
    } else {
      // Need to create org first
      setStep('csr-org')
    }
  }

  const handleOrgCreated = () => {
    // Generate a mock org ID
    setCreatedOrgId(`org_${Math.random().toString(36).substr(2, 8)}`)
    setStep('csr-practice')
  }

  const resetDemo = () => {
    setStep('list')
    setSelectedType('HealthSystem')
    setCsrScenario('new-customer')
    setCsrOrgData({ name: '', type: 'Health System' })
    setCsrPracticeData({ name: '', npi: '', products: [] })
    setCreatedOrgId('')
    setFormData({
      accountName: '',
      accountSegment: 'Health System',
      parentAccount: '',
      ultimateParentOrgId: '',
      parentOrgId: '',
      website: '',
      phone: '',
      territory: '',
    })
    setSearchQuery('')
  }

  const getStepDetails = () => {
    switch (step) {
      case 'list':
        return { phase: 1, title: 'Accounts List', desc: 'Click "New" to create a new prospect' }
      case 'type-modal':
        return { phase: 1, title: 'Select Type', desc: 'Choose the type of account' }
      case 'form':
        return { phase: 1, title: 'Account Form', desc: 'Fill in prospect details' }
      case 'detail':
        return { phase: 2, title: 'Account Detail', desc: 'Click "Create CSR Account"' }
      case 'csr-org':
        return { phase: 2, title: 'Create Org', desc: 'Set up organization in CSR' }
      case 'csr-practice':
        return { phase: 2, title: 'Create Practice', desc: 'Add practice details' }
      case 'success':
        return { phase: 2, title: 'Success', desc: 'Account created!' }
      default:
        return { phase: 1, title: '', desc: '' }
    }
  }

  const stepDetails = getStepDetails()

  return (
    <div className="demo-overlay">
      <div className="proposed-demo-modal">
        {/* Header */}
        <div className="proposed-demo-header">
          <h2>Commercial Team Flow: New Client</h2>
          <button className="demo-close" onClick={onClose}>×</button>
        </div>

        <div className="proposed-demo-body">
          {/* Left Sidebar */}
          <div className="proposed-demo-sidebar">
            <div className="demo-nav-title">Workflow Steps</div>

            <div
              className={`demo-nav-item ${stepDetails.phase === 1 ? 'active' : ''} ${getStepNumber() > 1 ? 'completed' : ''}`}
              onClick={() => setStep('list')}
            >
              <div className="demo-nav-number">1</div>
              <div className="demo-nav-info">
                <div className="demo-nav-label">Create Prospect</div>
                <div className="demo-nav-system">Salesforce</div>
                {stepDetails.phase === 1 && (
                  <div className="demo-nav-substep">{stepDetails.title}</div>
                )}
              </div>
            </div>

            <div
              className={`demo-nav-item ${stepDetails.phase === 2 ? 'active' : ''}`}
              onClick={() => formData.accountName ? setStep('detail') : null}
              style={{ cursor: formData.accountName ? 'pointer' : 'not-allowed', opacity: formData.accountName ? 1 : 0.5 }}
            >
              <div className="demo-nav-number">2</div>
              <div className="demo-nav-info">
                <div className="demo-nav-label">Convert to Client</div>
                <div className="demo-nav-system">CSR / Product Account</div>
                {stepDetails.phase === 2 && (
                  <div className="demo-nav-substep">{stepDetails.title}</div>
                )}
              </div>
            </div>

            <div className="demo-sidebar-footer">
              <button className="btn btn-sm" onClick={resetDemo}>Reset Demo</button>
            </div>
          </div>

          {/* Main Content */}
          <div className="proposed-demo-main">
            {/* Step 1: Accounts List */}
            {step === 'list' && (
              <div className="proposed-demo-screen">
                <div className="sf-header">
              <div className="sf-header-left">
                <span className="sf-cloud-icon">☁️</span>
                <span className="sf-title">Sales Console</span>
                <span className="sf-subtitle">Accounts</span>
              </div>
              <div className="sf-search">
                <input type="text" placeholder="Search..." />
              </div>
            </div>

            <div className="sf-page">
              <div className="sf-page-header">
                <div className="sf-page-title">
                  <span className="sf-icon">📋</span>
                  <span>Recently Viewed</span>
                  <span className="sf-count">{MOCK_ACCOUNTS.length}+ items</span>
                </div>
                <div className="sf-page-actions">
                  <button className="btn btn-sf-primary" onClick={() => setStep('type-modal')}>New</button>
                  <button className="btn btn-sf">Import</button>
                  <button className="btn btn-sf">Discover Companies</button>
                </div>
              </div>

              <div className="sf-filter-bar">
                <input
                  type="text"
                  placeholder="Search this list..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="sf-filter-input"
                />
              </div>

              <div className="sf-table">
                <div className="sf-table-header">
                  <div className="sf-col sf-col-check"><input type="checkbox" /></div>
                  <div className="sf-col sf-col-name">Account Name</div>
                  <div className="sf-col sf-col-segment">Account Segment</div>
                  <div className="sf-col sf-col-id">Practice ID</div>
                  <div className="sf-col sf-col-phone">Phone</div>
                  <div className="sf-col sf-col-website">Website</div>
                  <div className="sf-col sf-col-state">Billing State</div>
                  <div className="sf-col sf-col-date">Last Activity</div>
                  <div className="sf-col sf-col-active">Is active practice?</div>
                </div>
                <div className="sf-table-body">
                  {filteredAccounts.map((account) => (
                    <div key={account.id} className="sf-table-row">
                      <div className="sf-col sf-col-check"><input type="checkbox" /></div>
                      <div className="sf-col sf-col-name">
                        <a href="#" onClick={e => e.preventDefault()}>{account.name}</a>
                      </div>
                      <div className="sf-col sf-col-segment">{account.segment}</div>
                      <div className="sf-col sf-col-id">{account.practiceId}</div>
                      <div className="sf-col sf-col-phone">{account.phone}</div>
                      <div className="sf-col sf-col-website">{account.website}</div>
                      <div className="sf-col sf-col-state">{account.state}</div>
                      <div className="sf-col sf-col-date">{account.lastActivity}</div>
                      <div className="sf-col sf-col-active">{account.isActive ? '✓' : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1b: Type Selection Modal */}
        {step === 'type-modal' && (
          <div className="proposed-demo-screen">
            <div className="sf-modal-backdrop">
              <div className="sf-modal">
                <div className="sf-modal-header">
                  <h3>New Account</h3>
                </div>
                <div className="sf-modal-body">
                  <div className="sf-radio-group">
                    <label className={`sf-radio ${selectedType === 'Practice' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="accountType"
                        checked={selectedType === 'Practice'}
                        onChange={() => setSelectedType('Practice')}
                      />
                      <span className="sf-radio-circle" />
                      <span className="sf-radio-label">Practice</span>
                    </label>
                    <label className={`sf-radio ${selectedType === 'BusinessDevelopment' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="accountType"
                        checked={selectedType === 'BusinessDevelopment'}
                        onChange={() => setSelectedType('BusinessDevelopment')}
                      />
                      <span className="sf-radio-circle" />
                      <div>
                        <span className="sf-radio-label">Business Development</span>
                        <span className="sf-radio-sublabel">Business Development</span>
                      </div>
                    </label>
                    <label className={`sf-radio ${selectedType === 'HealthSystem' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="accountType"
                        checked={selectedType === 'HealthSystem'}
                        onChange={() => setSelectedType('HealthSystem')}
                      />
                      <span className="sf-radio-circle" />
                      <span className="sf-radio-label">Health System</span>
                    </label>
                  </div>
                </div>
                <div className="sf-modal-footer">
                  <button className="btn btn-sf" onClick={() => setStep('list')}>Cancel</button>
                  <button className="btn btn-sf-primary" onClick={() => setStep('form')}>Next</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Account Form */}
        {step === 'form' && (
          <div className="proposed-demo-screen">
            <div className="sf-form-page">
              <div className="sf-form-header">
                <h3>New Account: {selectedType === 'HealthSystem' ? 'Health System' : selectedType === 'BusinessDevelopment' ? 'Business Development' : 'Practice'}</h3>
                <span className="sf-required-note">* = Required Information</span>
              </div>

              <div className="sf-form-section">
                <div className="sf-form-row">
                  <div className="sf-form-field">
                    <label>Account Owner</label>
                    <div className="sf-form-value">
                      <span className="sf-avatar">Z</span>
                      <span>Rashmi Srivastava</span>
                    </div>
                  </div>
                  <div className="sf-form-field">
                    <label>Enterprise Onboarding Partner</label>
                    <input type="text" placeholder="Search People..." className="sf-input" />
                  </div>
                </div>
                <div className="sf-form-row">
                  <div className="sf-form-field">
                    <label>Customer Success Team Member</label>
                    <input type="text" placeholder="Search People..." className="sf-input" />
                  </div>
                  <div className="sf-form-field">
                    <label>Enterprise Support Associate</label>
                    <input type="text" placeholder="Search People..." className="sf-input" />
                  </div>
                </div>
                <div className="sf-form-row">
                  <div className="sf-form-field">
                    <label>Technical Account Manager</label>
                    <div className="sf-form-value empty">—</div>
                  </div>
                </div>
              </div>

              <div className="sf-form-section">
                <h4 className="sf-section-title">Highlights</h4>
                <div className="sf-form-row">
                  <div className="sf-form-field">
                    <label>* Account Name</label>
                    <input
                      type="text"
                      className="sf-input"
                      value={formData.accountName}
                      onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                    />
                  </div>
                  <div className="sf-form-field">
                    <label>Primary Account</label>
                    <div className="sf-checkbox-value">
                      <input type="checkbox" defaultChecked />
                      <span className="sf-hint">This field is calculated upon save</span>
                    </div>
                  </div>
                </div>
                <div className="sf-form-row">
                  <div className="sf-form-field">
                    <label>Account Segment</label>
                    <select className="sf-select" value={formData.accountSegment} onChange={e => setFormData({ ...formData, accountSegment: e.target.value })}>
                      <option>Health System</option>
                      <option>Large Provider Group</option>
                      <option>Mid-Market</option>
                      <option>Local</option>
                    </select>
                    <a href="#" className="sf-link" onClick={e => e.preventDefault()}>View all dependencies</a>
                  </div>
                  <div className="sf-form-field">
                    <label>Parent Account</label>
                    <select
                      className="sf-select"
                      value={formData.parentAccount}
                      onChange={e => {
                        const val = e.target.value
                        if (val === '') {
                          setFormData({ ...formData, parentAccount: '', ultimateParentOrgId: '', parentOrgId: '' })
                        } else if (val === 'northwell-child') {
                          setFormData({ ...formData, parentAccount: 'Northwell Health (Child Org)', ultimateParentOrgId: 'org_northwell', parentOrgId: 'org_northwell_child' })
                        } else if (val === 'northwell') {
                          setFormData({ ...formData, parentAccount: 'Northwell Health', ultimateParentOrgId: 'org_northwell', parentOrgId: '' })
                        } else if (val === 'lifestance') {
                          setFormData({ ...formData, parentAccount: 'LifeStance Health', ultimateParentOrgId: 'org_lifestance', parentOrgId: '' })
                        }
                      }}
                    >
                      <option value="">-- No Parent (New Customer) --</option>
                      <option value="northwell">Northwell Health (Ultimate Parent Only)</option>
                      <option value="northwell-child">Northwell Health → Northwell Cardiology (Has Parent Org)</option>
                      <option value="lifestance">LifeStance Health (Ultimate Parent Only)</option>
                    </select>
                    <span className="sf-hint csr-hint">
                      {!formData.ultimateParentOrgId && '→ Will create: Org + Practice'}
                      {formData.ultimateParentOrgId && !formData.parentOrgId && '→ Will create: Child Org + Practice'}
                      {formData.parentOrgId && '→ Will create: Practice only'}
                    </span>
                  </div>
                </div>
                <div className="sf-form-row">
                  <div className="sf-form-field">
                    <label>Sub-Segment</label>
                    <div className="sf-form-value">Health System</div>
                    <span className="sf-hint">This field is calculated upon save</span>
                  </div>
                  <div className="sf-form-field">
                    <label>Is active practice?</label>
                    <div className="sf-form-value">—</div>
                    <span className="sf-hint">This field is calculated upon save</span>
                  </div>
                </div>
                <div className="sf-form-row">
                  <div className="sf-form-field">
                    <label>Mid-Market</label>
                    <input type="checkbox" />
                  </div>
                  <div className="sf-form-field">
                    <label>Practice Churn Date</label>
                    <input type="date" className="sf-input" />
                  </div>
                </div>
                <div className="sf-form-row">
                  <div className="sf-form-field">
                    <label>Website</label>
                    <input type="text" className="sf-input" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
                  </div>
                  <div className="sf-form-field">
                    <label>Practice (Salesforce)</label>
                    <div className="sf-form-value empty">—</div>
                  </div>
                </div>
                <div className="sf-form-row">
                  <div className="sf-form-field">
                    <label>Phone</label>
                    <input type="text" className="sf-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className="sf-form-field">
                    <label>Practice DSP</label>
                    <div className="sf-form-value">No DSP</div>
                    <span className="sf-hint">This field is calculated upon save</span>
                  </div>
                </div>
              </div>

              <div className="sf-form-actions">
                <button className="btn btn-sf" onClick={() => setStep('type-modal')}>Cancel</button>
                <button className="btn btn-sf">Save & New</button>
                <button className="btn btn-sf-primary" onClick={() => setStep('detail')}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Account Detail */}
        {step === 'detail' && (
          <div className="proposed-demo-screen">
            <div className="sf-detail-page">
              <div className="sf-detail-header">
                <div className="sf-detail-title">
                  <span className="sf-detail-icon">📋</span>
                  <div>
                    <span className="sf-detail-label">Account</span>
                    <h3>{formData.accountName || 'New Health System Account'}</h3>
                  </div>
                </div>
                <div className="sf-detail-actions">
                  <button className="btn btn-sf">Edit</button>
                  <button className="btn btn-sf">Escalate</button>
                  <button className="btn btn-sf">Submit to SalesOps</button>
                  <button className="btn btn-sf-csr" onClick={handleCreateCSRAccount}>Create CSR Account</button>
                </div>
              </div>

              <div className="sf-detail-body">
                <div className="sf-detail-main">
                  <div className="sf-detail-section">
                    <h4>In-Flight Products</h4>
                    <p className="sf-empty">No in-flight products found</p>
                  </div>
                  <div className="sf-detail-section">
                    <h4>Eligible Products</h4>
                    <p className="sf-empty">No eligible products available</p>
                  </div>

                  <div className="sf-detail-section">
                    <div className="sf-detail-section-header">
                      <h4>Account Team (0)</h4>
                      <div className="sf-detail-section-actions">
                        <button className="btn btn-sf-sm">Add Default Team</button>
                        <button className="btn btn-sf-sm">Add Team Members</button>
                      </div>
                    </div>
                  </div>

                  <div className="sf-tabs">
                    <button className="sf-tab active">Details</button>
                    <button className="sf-tab">Related</button>
                    <button className="sf-tab">Engagement Insights</button>
                  </div>

                  <div className="sf-detail-section">
                    <h4>Highlights</h4>
                    <div className="sf-detail-grid">
                      <div className="sf-detail-field">
                        <label>Account Name</label>
                        <span>{formData.accountName || 'New Health System Account'}</span>
                      </div>
                      <div className="sf-detail-field">
                        <label>Primary Account</label>
                        <span>✓</span>
                      </div>
                      <div className="sf-detail-field">
                        <label>Account Segment</label>
                        <span>{formData.accountSegment}</span>
                      </div>
                      <div className="sf-detail-field">
                        <label>Parent Account</label>
                        <span>—</span>
                      </div>
                      <div className="sf-detail-field">
                        <label>Is active practice?</label>
                        <span>✓</span>
                      </div>
                      <div className="sf-detail-field">
                        <label>Website</label>
                        <span>{formData.website || '—'}</span>
                      </div>
                      <div className="sf-detail-field">
                        <label>Phone</label>
                        <span>{formData.phone || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="sf-detail-sidebar">
                  <div className="sf-sidebar-card">
                    <div className="sf-sidebar-alert">
                      <span className="sf-alert-icon">⚠️</span>
                      <span>We found no potential duplicates of this Account.</span>
                    </div>
                  </div>
                  <div className="sf-sidebar-card">
                    <h4>Lock Account Hierarchy</h4>
                    <p>Click "Next" to start the process to lock this hierarchy.</p>
                    <button className="btn btn-sf-primary btn-sm">Next</button>
                  </div>
                  <div className="sf-sidebar-section">
                    <h4>Opportunities (0)</h4>
                  </div>
                  <div className="sf-sidebar-section">
                    <h4>Contacts</h4>
                  </div>
                  <div className="sf-sidebar-section">
                    <h4>Cases</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CSR Wizard: Create Org */}
        {step === 'csr-org' && (
          <div className="proposed-demo-screen">
            <div className="csr-wizard">
              <div className="csr-wizard-header">
                <div className="csr-wizard-icon">🏢</div>
                <div className="csr-wizard-title">
                  <h3>Create Organization</h3>
                  <p className="csr-scenario-badge">
                    {csrScenario === 'new-customer' && 'New Customer → Creating Ultimate Parent Org'}
                    {csrScenario === 'existing-no-parent-org' && `Existing Customer → Creating Child Org under ${formData.parentAccount}`}
                  </p>
                </div>
                <div className="csr-wizard-steps">
                  <span className="csr-step active">1. Create Org</span>
                  <span className="csr-step-arrow">→</span>
                  <span className="csr-step">2. Add Practice</span>
                </div>
              </div>

              <div className="csr-wizard-body">
                <div className="csr-form">
                  <div className="modal-hint">
                    {csrScenario === 'new-customer'
                      ? 'This creates a top-level organization with no parent. A practice will be added in the next step.'
                      : `This creates a child organization under "${formData.parentAccount}". A practice will be added in the next step.`
                    }
                  </div>

                  <div className="form-group">
                    <label>Organization Name *</label>
                    <input
                      type="text"
                      className="sf-input"
                      value={csrOrgData.name}
                      onChange={e => setCsrOrgData({ ...csrOrgData, name: e.target.value })}
                      placeholder="Enter organization name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Organization Type *</label>
                    <select
                      className="sf-select"
                      value={csrOrgData.type}
                      onChange={e => setCsrOrgData({ ...csrOrgData, type: e.target.value })}
                    >
                      <option value="Health System">Health System (HS)</option>
                      <option value="Large Provider Group">Large Provider Group (LPG)</option>
                      <option value="Mid-Market">Mid-Market (MM)</option>
                      <option value="Local">Local</option>
                    </select>
                  </div>

                  {csrScenario === 'existing-no-parent-org' && (
                    <div className="form-group">
                      <label>Parent Organization</label>
                      <div className="sf-form-value">
                        <span className="parent-org-badge">{formData.parentAccount}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="csr-wizard-footer">
                <button className="btn btn-sf" onClick={() => setStep('detail')}>Cancel</button>
                <button
                  className="btn btn-sf-primary"
                  onClick={handleOrgCreated}
                  disabled={!csrOrgData.name.trim()}
                >
                  {csrScenario === 'new-customer' ? 'Create Ultimate Parent' : 'Create Child Org'} →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CSR Wizard: Create Practice */}
        {step === 'csr-practice' && (
          <div className="proposed-demo-screen">
            <div className="csr-wizard">
              <div className="csr-wizard-header">
                <div className="csr-wizard-icon">🏥</div>
                <div className="csr-wizard-title">
                  <h3>Add Practice</h3>
                  <p className="csr-scenario-badge">
                    {csrScenario === 'existing-with-parent-org'
                      ? `Adding practice under existing org: ${formData.parentAccount}`
                      : `Adding practice under new org: ${csrOrgData.name}`
                    }
                  </p>
                </div>
                <div className="csr-wizard-steps">
                  {csrScenario !== 'existing-with-parent-org' && (
                    <>
                      <span className="csr-step completed">1. Create Org ✓</span>
                      <span className="csr-step-arrow">→</span>
                    </>
                  )}
                  <span className="csr-step active">
                    {csrScenario === 'existing-with-parent-org' ? '1. Add Practice' : '2. Add Practice'}
                  </span>
                </div>
              </div>

              <div className="csr-wizard-body">
                <div className="csr-form">
                  {csrScenario !== 'existing-with-parent-org' && createdOrgId && (
                    <div className="csr-created-org-notice">
                      <span className="notice-icon">✓</span>
                      <span>Organization "{csrOrgData.name}" created (ID: {createdOrgId})</span>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Practice Name *</label>
                    <input
                      type="text"
                      className="sf-input"
                      value={csrPracticeData.name}
                      onChange={e => setCsrPracticeData({ ...csrPracticeData, name: e.target.value })}
                      placeholder="Enter practice name"
                    />
                  </div>

                  <div className="form-group">
                    <label>NPI Number</label>
                    <input
                      type="text"
                      className="sf-input"
                      value={csrPracticeData.npi}
                      onChange={e => setCsrPracticeData({ ...csrPracticeData, npi: e.target.value })}
                      placeholder="Enter NPI"
                    />
                  </div>

                  <div className="form-group">
                    <label>Products</label>
                    <div className="product-checkboxes">
                      {['Marketplace', 'Book from Google', 'Wellhive', 'Yelp', 'Healthgrades', 'ZVS', 'Intake', 'Zo', 'Bookable Directory'].map(product => (
                        <label key={product} className="product-checkbox">
                          <input
                            type="checkbox"
                            checked={csrPracticeData.products.includes(product)}
                            onChange={e => {
                              if (e.target.checked) {
                                setCsrPracticeData({ ...csrPracticeData, products: [...csrPracticeData.products, product] })
                              } else {
                                setCsrPracticeData({ ...csrPracticeData, products: csrPracticeData.products.filter(p => p !== product) })
                              }
                            }}
                          />
                          <span>{product}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="csr-wizard-footer">
                <button className="btn btn-sf" onClick={() => csrScenario === 'existing-with-parent-org' ? setStep('detail') : setStep('csr-org')}>
                  ← Back
                </button>
                <button
                  className="btn btn-sf-csr"
                  onClick={() => setStep('success')}
                  disabled={!csrPracticeData.name.trim()}
                >
                  Create CSR Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {step === 'success' && (
          <div className="proposed-demo-screen">
            <div className="demo-success">
              <div className="success-icon">✓</div>
              <h3>CSR Account Created Successfully!</h3>
              <p>
                {csrScenario === 'new-customer' && 'New organization and practice created in CSR and synced to POGS.'}
                {csrScenario === 'existing-no-parent-org' && 'Child organization and practice created under existing customer.'}
                {csrScenario === 'existing-with-parent-org' && 'Practice created under existing organization.'}
              </p>
              <div className="success-details">
                {csrScenario !== 'existing-with-parent-org' && (
                  <div className="success-detail">
                    <label>{csrScenario === 'new-customer' ? 'Organization' : 'Child Organization'}</label>
                    <span>{csrOrgData.name}</span>
                  </div>
                )}
                {csrScenario !== 'existing-with-parent-org' && (
                  <div className="success-detail">
                    <label>Org ID</label>
                    <span>{createdOrgId || `org_${Math.random().toString(36).substr(2, 8)}`}</span>
                  </div>
                )}
                {csrScenario !== 'new-customer' && (
                  <div className="success-detail">
                    <label>Parent Organization</label>
                    <span>{formData.parentAccount}</span>
                  </div>
                )}
                <div className="success-detail">
                  <label>Practice Name</label>
                  <span>{csrPracticeData.name}</span>
                </div>
                <div className="success-detail">
                  <label>Practice ID</label>
                  <span>PRC-{Math.floor(100000 + Math.random() * 900000)}</span>
                </div>
                {csrPracticeData.npi && (
                  <div className="success-detail">
                    <label>NPI</label>
                    <span>{csrPracticeData.npi}</span>
                  </div>
                )}
                {csrPracticeData.products.length > 0 && (
                  <div className="success-detail">
                    <label>Products</label>
                    <span>{csrPracticeData.products.join(', ')}</span>
                  </div>
                )}
              </div>
              <div className="success-actions">
                <button className="btn btn-sf" onClick={resetDemo}>Start Over</button>
                <button className="btn btn-sf-primary" onClick={onClose}>Done</button>
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

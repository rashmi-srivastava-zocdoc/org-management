import { useState, useEffect } from 'react'
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
const AVAILABLE_PRODUCTS: { value: ProductType; label: string; free?: boolean }[] = [
  { value: 'BookablePresence', label: 'Bookable Presence', free: true },
  { value: 'Marketplace', label: 'Marketplace' },
  { value: 'PracticeSolutions', label: 'Practice Solutions' },
]

type ViewMode = 'org-management' | 'flow-walkthrough'

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
  const [showEditHierarchyModal, setShowEditHierarchyModal] = useState(false)

  // Pre-populated create org data (from URL params)
  const [prefilledOrgData, setPrefilledOrgData] = useState<{ name: string; type: string } | null>(null)

  // Fullscreen demo mode
  const [fullscreenDemo, setFullscreenDemo] = useState<'proposed' | null>(null)
  const [demoWorkflow, setDemoWorkflow] = useState<WorkflowType | null>(null)

  // State for showing newly created org banner
  const [newlyCreatedOrg, setNewlyCreatedOrg] = useState<{ orgName: string; practiceName: string } | null>(null)

  // Handle URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    // Check for fullscreen demo mode
    if (params.get('demo') === 'proposed') {
      setFullscreenDemo('proposed')
      const wf = params.get('workflow')
      if (wf === 'new-account' || wf === 'child-account' || wf === 'change-prospect' || wf === 'change-client') {
        setDemoWorkflow(wf)
      }
      return
    }

    // Check for newly created org from demo flow
    const newOrgName = params.get('newOrg')
    const newPracticeName = params.get('newPractice')
    if (newOrgName) {
      const newOrgId = `org_${Math.random().toString(36).substr(2, 8)}`
      const newOrg: Organization = {
        id: newOrgId,
        name: newOrgName,
        type: 'LargeProviderGroup',
        children: [],
      }
      setOrganizations(prev => [newOrg, ...prev])

      if (newPracticeName) {
        const newPractice: Practice = {
          id: `p_${Math.random().toString(36).substr(2, 8)}`,
          name: newPracticeName,
          parentOrgId: newOrgId,
          products: ['BookablePresence', 'Marketplace'],
        }
        setPractices(prev => [newPractice, ...prev])
      }

      setSelectedOrg(newOrg)
      setSelectedItems(new Set([newOrgId]))
      setExpandedOrgs(prev => new Set([...prev, newOrgId]))
      setNewlyCreatedOrg({ orgName: newOrgName, practiceName: newPracticeName || '' })
      setViewMode('org-management')
      // Clear URL params after reading
      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    // Check for create org with prefilled data
    if (params.get('createOrg') === 'true') {
      const orgName = params.get('orgName') || ''
      const orgType = params.get('orgType') || 'LargeProviderGroup'
      setPrefilledOrgData({ name: orgName, type: orgType })
      setViewMode('org-management')
      setShowCreateOrgModal(true)
      // Clear URL params after reading
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

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

  // Fullscreen demo mode - render demo without app chrome
  if (fullscreenDemo === 'proposed') {
    return (
      <div className="fullscreen-demo">
        <CommercialTeamDemo
          onClose={() => window.close()}
          fullscreen
          initialWorkflow={demoWorkflow}
        />
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
            className={`view-tab ${viewMode === 'flow-walkthrough' ? 'active' : ''}`}
            onClick={() => setViewMode('flow-walkthrough')}
          >
            Flow Walkthrough
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {viewMode === 'flow-walkthrough' && <FlowWalkthrough />}
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
                <h2>Organization Hierarchy</h2>
                <div className="org-ids">
                  <span>Organization ID: {selectedOrg.id}</span>
                </div>
              </div>
            </div>

            {/* Success Banner for newly created org */}
            {newlyCreatedOrg && selectedOrg.name === newlyCreatedOrg.orgName && (
              <div className="creation-success-banner">
                <span className="success-check-icon">✓</span>
                <span>
                  Organization "{newlyCreatedOrg.orgName}"
                  {newlyCreatedOrg.practiceName && ` and practice "${newlyCreatedOrg.practiceName}"`}
                  {' '}created successfully!
                </span>
                <button className="banner-close" onClick={() => setNewlyCreatedOrg(null)}>×</button>
              </div>
            )}

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
                  onClick={() => setShowEditHierarchyModal(true)}
                  disabled={selectedItems.size !== 1}
                >
                  Change Parent
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
          onClose={() => {
            setShowCreateOrgModal(false)
            setPrefilledOrgData(null)
          }}
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
          initialData={prefilledOrgData}
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

      {/* Edit Hierarchy Modal */}
      {showEditHierarchyModal && selectedItems.size === 1 && (() => {
        const selectedId = Array.from(selectedItems)[0]
        const isOrg = selectedId?.startsWith('org')
        const selectedOrgItem = isOrg ? allOrgs.find(o => o.id === selectedId) : null
        const selectedPractice = !isOrg ? practices.find(p => p.id === selectedId) : null
        const currentPath = selectedOrgItem ? getOrgPath(selectedOrgItem.id) :
                           selectedPractice ? getOrgPath(selectedPractice.parentOrgId) : []

        if (!selectedOrgItem && !selectedPractice) return null

        return (
          <EditHierarchyModal
            selectedItem={selectedOrgItem || selectedPractice}
            isOrg={isOrg}
            currentPath={currentPath}
            allOrgs={allOrgs}
            practices={practices}
            onClose={() => setShowEditHierarchyModal(false)}
            onMoveOrg={(orgId, newParentId) => {
              // Move org to new parent
              const moveOrg = (orgs: Organization[]): Organization[] => {
                // First, remove org from its current location
                let movedOrg: Organization | null = null
                const removeOrg = (orgList: Organization[]): Organization[] => {
                  return orgList.filter(org => {
                    if (org.id === orgId) {
                      movedOrg = org
                      return false
                    }
                    if (org.children) {
                      org.children = removeOrg(org.children)
                    }
                    return true
                  })
                }
                let updated = removeOrg([...orgs])

                // Then add to new parent
                if (movedOrg && newParentId) {
                  const addToParent = (orgList: Organization[]): Organization[] => {
                    return orgList.map(org => {
                      if (org.id === newParentId) {
                        return { ...org, children: [...(org.children || []), movedOrg!] }
                      }
                      if (org.children) {
                        return { ...org, children: addToParent(org.children) }
                      }
                      return org
                    })
                  }
                  updated = addToParent(updated)
                }
                return updated
              }
              setOrganizations(moveOrg(organizations))
              setShowEditHierarchyModal(false)
            }}
            onMovePractice={(practiceId, newParentOrgId) => {
              setPractices(practices.map(p =>
                p.id === practiceId ? { ...p, parentOrgId: newParentOrgId } : p
              ))
              setShowEditHierarchyModal(false)
            }}
          />
        )
      })()}
    </div>
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
                      <span>
                        {product.label}
                        {product.free && <span className="product-free-badge">Free</span>}
                      </span>
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

// Mock Users Data for Access Impact
const MOCK_USERS = [
  { id: 'u1', name: 'John Smith', email: 'john.smith@northwell.com', role: 'Admin' },
  { id: 'u2', name: 'Sarah Johnson', email: 'sarah.j@northwell.com', role: 'Manager' },
  { id: 'u3', name: 'Mike Chen', email: 'mchen@northwell.com', role: 'User' },
  { id: 'u4', name: 'Lisa Park', email: 'lisa.park@lifestance.com', role: 'Admin' },
  { id: 'u5', name: 'David Williams', email: 'd.williams@lifestance.com', role: 'Manager' },
  { id: 'u6', name: 'Emily Brown', email: 'ebrown@zocdoc.com', role: 'Super Admin' },
]

// Edit Hierarchy Modal Component
function EditHierarchyModal({
  selectedItem,
  isOrg,
  currentPath,
  allOrgs,
  practices: _practices,
  onClose,
  onMoveOrg,
  onMovePractice,
}: {
  selectedItem: Organization | Practice | null | undefined
  isOrg: boolean
  currentPath: Organization[]
  allOrgs: Organization[]
  practices: Practice[]
  onClose: () => void
  onMoveOrg: (orgId: string, newParentId: string | null) => void
  onMovePractice: (practiceId: string, newParentOrgId: string) => void
}) {
  const [moveOption, setMoveOption] = useState<'within' | 'different'>('within')
  const [newParentId, setNewParentId] = useState<string>('')
  const [showAccessImpact, setShowAccessImpact] = useState(false)

  if (!selectedItem) return null

  const currentParentId = isOrg
    ? currentPath.length > 1 ? currentPath[currentPath.length - 2]?.id : null
    : (selectedItem as Practice).parentOrgId

  const currentParentOrg = currentParentId
    ? allOrgs.find(o => o.id === currentParentId)
    : null

  const ultimateParentId = currentPath[0]?.id

  const getValidParents = () => {
    if (isOrg) {
      const org = selectedItem as Organization
      const descendants = new Set<string>()
      const collectDescendants = (o: Organization) => {
        descendants.add(o.id)
        o.children?.forEach(collectDescendants)
      }
      collectDescendants(org)

      if (moveOption === 'within') {
        return allOrgs.filter(o =>
          currentPath.some(p => p.id === o.id || allOrgs.find(a => a.id === ultimateParentId)?.children?.some(c => c.id === o.id)) &&
          !descendants.has(o.id) &&
          o.id !== org.id
        )
      } else {
        return allOrgs.filter(o =>
          !descendants.has(o.id) &&
          o.id !== org.id &&
          !currentPath.some(p => p.id === o.id)
        )
      }
    } else {
      if (moveOption === 'within') {
        return allOrgs.filter(o =>
          currentPath.some(p => p.id === o.id) ||
          currentPath[currentPath.length - 1]?.children?.some(c => c.id === o.id)
        )
      } else {
        return allOrgs.filter(o =>
          !currentPath.some(p => p.id === o.id)
        )
      }
    }
  }

  const validParents = getValidParents()

  const getAccessImpact = () => {
    const currentUsers = MOCK_USERS.slice(0, 3)
    const newUsers = moveOption === 'different'
      ? MOCK_USERS.slice(3, 6)
      : MOCK_USERS.slice(0, 3)

    const gaining = newUsers.filter(u => !currentUsers.some(cu => cu.id === u.id))
    const losing = currentUsers.filter(u => !newUsers.some(nu => nu.id === u.id))

    return { gaining, losing }
  }

  const accessImpact = getAccessImpact()

  const handleConfirmMove = () => {
    if (isOrg) {
      onMoveOrg(selectedItem.id, newParentId || null)
    } else {
      if (newParentId) {
        onMovePractice(selectedItem.id, newParentId)
      }
    }
  }

  const newParentOrg = newParentId ? allOrgs.find(o => o.id === newParentId) : null

  if (showAccessImpact) {
    return (
      <div className="modal-overlay">
        <div className="modal new-client-wizard">
          <div className="modal-header">
            <h2>Confirm Access Changes</h2>
            <button className="modal-close" onClick={() => setShowAccessImpact(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="access-impact-content">
              <div className="impact-summary">
                <p>Moving <strong>{selectedItem.name}</strong> from <strong>{currentParentOrg?.name || 'Root'}</strong> to <strong>{newParentOrg?.name || 'Root'}</strong></p>
              </div>

              {accessImpact.gaining.length > 0 && (
                <div className="impact-section gaining">
                  <h4>
                    <span className="impact-icon">✓</span>
                    Users who will gain access ({accessImpact.gaining.length})
                  </h4>
                  <div className="impact-users">
                    {accessImpact.gaining.map(user => (
                      <div key={user.id} className="impact-user">
                        <div className="user-avatar">{user.name[0]}</div>
                        <div className="user-info">
                          <div className="user-name">{user.name}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                        <div className="user-role">{user.role}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {accessImpact.losing.length > 0 && (
                <div className="impact-section losing">
                  <h4>
                    <span className="impact-icon">✗</span>
                    Users who will lose access ({accessImpact.losing.length})
                  </h4>
                  <div className="impact-users">
                    {accessImpact.losing.map(user => (
                      <div key={user.id} className="impact-user">
                        <div className="user-avatar">{user.name[0]}</div>
                        <div className="user-info">
                          <div className="user-name">{user.name}</div>
                          <div className="user-email">{user.email}</div>
                        </div>
                        <div className="user-role">{user.role}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {accessImpact.gaining.length === 0 && accessImpact.losing.length === 0 && (
                <div className="impact-section no-change">
                  <p>No access changes will occur with this move.</p>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowAccessImpact(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleConfirmMove}>
              Confirm Move
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay">
      <div className="modal new-client-wizard wide-modal">
        <div className="modal-header">
          <h2>Edit Hierarchy</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body split-view">
          {/* Left: Current Hierarchy */}
          <div className="split-left">
            <div className="org-hierarchy-preview">
              <div className="hierarchy-preview-title">Current Position</div>
              <div className="hierarchy-preview-tree">
                {currentPath.map((org, index) => (
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
                {/* Selected Item */}
                <div className="hierarchy-row" style={{ paddingLeft: currentPath.length * 20 }}>
                  <span className="hierarchy-connector">└─</span>
                  <div className={`hierarchy-node ${isOrg ? 'org-node' : 'practice-node'} selected-node`} style={{ display: 'inline-flex' }}>
                    <span className="node-icon">{isOrg ? '🏢' : '🏥'}</span>
                    <span className="node-name">{selectedItem.name}</span>
                    <span className={`type-badge ${isOrg ? 'child' : 'practice'}`}>
                      {isOrg ? TYPE_ABBREV[(selectedItem as Organization).type] || (selectedItem as Organization).type : 'Practice'}
                    </span>
                    <span className="selected-badge">← Selected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Move Options */}
          <div className="split-right">
            <div className="form-section">
              <h4>Move {isOrg ? 'Organization' : 'Practice'}</h4>

              <div className="form-group">
                <label>Where do you want to move this {isOrg ? 'organization' : 'practice'}?</label>
                <div className="radio-options">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="moveOption"
                      checked={moveOption === 'within'}
                      onChange={() => { setMoveOption('within'); setNewParentId('') }}
                    />
                    <span>Within current hierarchy</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="moveOption"
                      checked={moveOption === 'different'}
                      onChange={() => { setMoveOption('different'); setNewParentId('') }}
                    />
                    <span>Move to a different organization</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Select New Parent *</label>
                <select
                  value={newParentId}
                  onChange={e => setNewParentId(e.target.value)}
                  className="parent-select"
                >
                  <option value="">-- Select Parent --</option>
                  {validParents.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({TYPE_ABBREV[org.type] || org.type})
                    </option>
                  ))}
                </select>
              </div>

              {newParentId && (
                <div className="new-position-preview">
                  <h5>New Position Preview</h5>
                  <div className="preview-box">
                    <div className="hierarchy-node org-node" style={{ display: 'inline-flex' }}>
                      <span className="node-icon">🏢</span>
                      <span className="node-name">{newParentOrg?.name}</span>
                      <span className="type-badge child">{TYPE_ABBREV[newParentOrg?.type || ''] || newParentOrg?.type}</span>
                    </div>
                    <div style={{ paddingLeft: 20 }}>
                      <span className="hierarchy-connector">└─</span>
                      <div className={`hierarchy-node ${isOrg ? 'org-node' : 'practice-node'}`} style={{ display: 'inline-flex' }}>
                        <span className="node-icon">{isOrg ? '🏢' : '🏥'}</span>
                        <span className="node-name">{selectedItem.name}</span>
                        <span className={`type-badge ${isOrg ? 'child' : 'practice'}`}>
                          {isOrg ? TYPE_ABBREV[(selectedItem as Organization).type] || (selectedItem as Organization).type : 'Practice'}
                        </span>
                        <span className="new-badge">← Will move here</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => setShowAccessImpact(true)}
            disabled={!newParentId}
          >
            Preview Access Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// Flow Walkthrough Component - selector page that launches a full-screen walkthrough
function FlowWalkthrough() {
  const [showCurrentDemo, setShowCurrentDemo] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['new-prospect']))

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

  const launchProposed = (workflow: string) => {
    const baseUrl = window.location.origin + window.location.pathname
    // Launch straight into the chosen workflow (skips the workflow-select menu).
    // Cache-bust so the demo window always loads the latest deployed bundle.
    window.open(`${baseUrl}?demo=proposed&workflow=${workflow}&v=${Date.now()}`, '_blank', 'width=1400,height=900')
  }

  return (
    <div className="flow-walkthrough-container">
      <div className="flow-walkthrough-intro">
        <h2>Choose a Flow to Walk Through</h2>
        <p>Select which workflow you'd like to experience step by step in full-screen mode.</p>
      </div>

      {/* Section 1: Creating a New Prospect */}
      <div className="scenario-accordion">
        <button className="accordion-header" onClick={() => toggleSection('new-prospect')}>
          <div className="accordion-title">
            <h3>Creating a New Prospect</h3>
            <p>Completely new relationship with Zocdoc</p>
          </div>
          <span className="accordion-icon">{expandedSections.has('new-prospect') ? '−' : '+'}</span>
        </button>
        {expandedSections.has('new-prospect') && (
          <div className="accordion-content">
            <div className="flow-choice-grid">
              <button className="flow-choice-card current" onClick={() => setShowCurrentDemo(true)}>
                <span className="flow-choice-badge current">Current</span>
                <span className="flow-choice-steps">3 steps</span>
                <span className="flow-choice-desc">
                  Create Prospect Account → Add Contact to Prospect → Convert to Client/CSR Account
                </span>
                <span className="flow-choice-systems">Salesforce → Salesforce → CSR (Retool)</span>
                <span className="flow-choice-cta">Start walkthrough →</span>
              </button>

              <button className="flow-choice-card proposed" onClick={() => launchProposed('new-account')}>
                <span className="flow-choice-badge proposed">Proposed</span>
                <span className="flow-choice-steps">2 steps</span>
                <span className="flow-choice-desc">
                  Create Prospect Account → Convert to Client/Product Account
                </span>
                <span className="flow-choice-systems">Salesforce → Product Tool (no contact required)</span>
                <span className="flow-choice-cta">Start walkthrough →</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: New child account under an existing ORG */}
      <div className="scenario-accordion">
        <button className="accordion-header" onClick={() => toggleSection('child-account')}>
          <div className="accordion-title">
            <h3>Adding a New Child Account Under an Existing ORG</h3>
            <p>Existing client adds a new account that rolls up under their organization</p>
          </div>
          <span className="accordion-icon">{expandedSections.has('child-account') ? '−' : '+'}</span>
        </button>
        {expandedSections.has('child-account') && (
          <div className="accordion-content">
            <div className="flow-choice-grid">
              <button className="flow-choice-card current" onClick={() => setShowCurrentDemo(true)}>
                <span className="flow-choice-badge current">Current</span>
                <span className="flow-choice-steps">3 steps</span>
                <span className="flow-choice-desc">
                  Create Prospect Account → Add Contact to Prospect → Convert &amp; manually link to parent in CSR
                </span>
                <span className="flow-choice-systems">Salesforce → Salesforce → CSR (Retool)</span>
                <span className="flow-choice-cta">Start walkthrough →</span>
              </button>

              <button className="flow-choice-card proposed" onClick={() => launchProposed('child-account')}>
                <span className="flow-choice-badge proposed">Proposed</span>
                <span className="flow-choice-steps">2 steps</span>
                <span className="flow-choice-desc">
                  Create Prospect Account → Convert &amp; choose parent ORG (hierarchy set automatically)
                </span>
                <span className="flow-choice-systems">Salesforce → Product Tool (parent selected in step 3)</span>
                <span className="flow-choice-cta">Start walkthrough →</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 3: New prospect under an existing ORG */}
      <div className="scenario-accordion">
        <button className="accordion-header" onClick={() => toggleSection('prospect-existing-org')}>
          <div className="accordion-title">
            <h3>Adding a New Prospect Under an Existing ORG</h3>
            <p>New prospect that should roll up under an organization already on Zocdoc</p>
          </div>
          <span className="accordion-icon">{expandedSections.has('prospect-existing-org') ? '−' : '+'}</span>
        </button>
        {expandedSections.has('prospect-existing-org') && (
          <div className="accordion-content">
            <div className="flow-choice-grid">
              <button className="flow-choice-card current" onClick={() => setShowCurrentDemo(true)}>
                <span className="flow-choice-badge current">Current</span>
                <span className="flow-choice-steps">3 steps</span>
                <span className="flow-choice-desc">
                  Create Prospect Account → Add Contact to Prospect → Convert &amp; manually set parent in CSR
                </span>
                <span className="flow-choice-systems">Salesforce → Salesforce → CSR (Retool)</span>
                <span className="flow-choice-cta">Start walkthrough →</span>
              </button>

              <button className="flow-choice-card proposed" onClick={() => launchProposed('new-account')}>
                <span className="flow-choice-badge proposed">Proposed</span>
                <span className="flow-choice-steps">2 steps</span>
                <span className="flow-choice-desc">
                  Create Prospect Account (pick Parent Account) → Convert to Client/Product Account
                </span>
                <span className="flow-choice-systems">Salesforce → Product Tool (parent set on the form)</span>
                <span className="flow-choice-cta">Start walkthrough →</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showCurrentDemo && (
        <CurrentWorkflowDemo fullscreen onClose={() => setShowCurrentDemo(false)} />
      )}
    </div>
  )
}

// Current Workflow Demo Modal
function CurrentWorkflowDemo({ onClose, fullscreen = false }: { onClose: () => void; fullscreen?: boolean }) {
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
    <div className={`demo-overlay ${fullscreen ? 'fullscreen' : ''}`} onClick={onClose}>
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
                          <span>{product.label}{product.free && <span className="product-free-badge">Free</span>}</span>
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
  initialData,
}: {
  onClose: () => void
  onCreateOrg: (org: Partial<Organization>) => void
  onCreatePractice: (orgId: string, practice: { name: string; products?: ProductType[] }) => void
  initialData?: { name: string; type: string } | null
}) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [orgData, setOrgData] = useState({
    name: initialData?.name || '',
    type: (initialData?.type || 'LargeProviderGroup') as Organization['type'],
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
                          <span>{product.label}{product.free && <span className="product-free-badge">Free</span>}</span>
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
type WorkflowType = 'new-account' | 'child-account' | 'change-prospect' | 'change-client'
type DemoStep = 'workflow-select' | 'list' | 'type-modal' | 'form' | 'detail' | 'csr-org' | 'csr-practice' | 'org-created' | 'success' | 'select-item' | 'change-parent' | 'access-impact' | 'change-success'
type AccountType = 'Practice' | 'BusinessDevelopment' | 'HealthSystem'
type CSRScenario = 'new-customer' | 'existing-no-parent-org' | 'existing-with-parent-org'

const WORKFLOW_OPTIONS = [
  {
    id: 'new-account' as WorkflowType,
    title: 'New Account (New Relationship)',
    description: 'Create a brand new customer account with no existing relationship',
    icon: '🆕'
  },
  {
    id: 'child-account' as WorkflowType,
    title: 'New Child Account (Existing Client)',
    description: 'Add a new opportunity under an existing client relationship',
    icon: '📎'
  },
  {
    id: 'change-prospect' as WorkflowType,
    title: 'Change Hierarchy for Prospect',
    description: 'Move a prospect account to a different parent organization',
    icon: '🔄'
  },
  {
    id: 'change-client' as WorkflowType,
    title: 'Change Hierarchy for Client',
    description: 'Move a client and its children to a different parent organization',
    icon: '🏗️'
  },
]

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

// Existing organizations a child account can be attached to (sets hierarchy)
const EXISTING_PARENT_ORGS = [
  { id: 'org_lifestance', name: 'LifeStance Health', segment: 'LPG' },
  { id: 'org_northwell', name: 'Northwell Health', segment: 'HS' },
  { id: 'org_privia', name: 'Privia Health', segment: 'LPG' },
  { id: 'org_orlando', name: 'Orlando Health', segment: 'HS' },
]

function CommercialTeamDemo({ onClose, fullscreen = false, initialWorkflow = null }: { onClose: () => void; fullscreen?: boolean; initialWorkflow?: WorkflowType | null }) {
  const [workflow, setWorkflow] = useState<WorkflowType | null>(initialWorkflow)
  const [step, setStep] = useState<DemoStep>(
    initialWorkflow
      ? (initialWorkflow === 'change-prospect' || initialWorkflow === 'change-client' ? 'select-item' : 'list')
      : 'workflow-select'
  )
  const [selectedType, setSelectedType] = useState<AccountType>('HealthSystem')
  const [selectedAccountForChange, setSelectedAccountForChange] = useState<typeof MOCK_ACCOUNTS[0] | null>(null)
  const [newParentAccount, setNewParentAccount] = useState<string>('')
  const [formData, setFormData] = useState({
    accountName: '',
    accountSegment: 'Health System',
    parentKey: '',
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
  // For child-account: the existing org chosen as parent in step 3 (sets hierarchy)
  const [csrParentOrg, setCsrParentOrg] = useState('')

  const filteredAccounts = searchQuery
    ? MOCK_ACCOUNTS.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : MOCK_ACCOUNTS

  const getStepNumber = (): number => {
    switch (step) {
      case 'list': case 'type-modal': return 1
      case 'form': return 2
      case 'detail': case 'csr-org': case 'csr-practice': case 'success': return 3
      default: return 1
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

    if (workflow === 'child-account') {
      // Child account: go to Create Client so the user can choose the parent org (sets hierarchy)
      setStep('csr-org')
    } else if (scenario === 'existing-with-parent-org') {
      // Skip org creation, go straight to practice
      setStep('csr-practice')
    } else {
      // Need to create org first
      setStep('csr-org')
    }
  }

  const handleOrgCreated = () => {
    // Redirect to actual Org Management app with the created org
    const baseUrl = window.location.origin + window.location.pathname
    const orgName = workflow === 'child-account'
      ? (EXISTING_PARENT_ORGS.find(o => o.id === csrParentOrg)?.name ?? 'TunaHealth')
      : 'TunaHealth'
    const practiceName = csrPracticeData.name || 'TunaHealth Practice'
    window.location.href = `${baseUrl}?newOrg=${encodeURIComponent(orgName)}&newPractice=${encodeURIComponent(practiceName)}`
  }

  const resetDemo = () => {
    setWorkflow(null)
    setStep('workflow-select')
    setSelectedType('HealthSystem')
    setCsrScenario('new-customer')
    setCsrOrgData({ name: '', type: 'Health System' })
    setCsrPracticeData({ name: '', npi: '', products: [] })
    setCreatedOrgId('')
    setCsrParentOrg('')
    setSelectedAccountForChange(null)
    setNewParentAccount('')
    setFormData({
      accountName: '',
      accountSegment: 'Health System',
      parentKey: '',
      parentAccount: '',
      ultimateParentOrgId: '',
      parentOrgId: '',
      website: '',
      phone: '',
      territory: '',
    })
    setSearchQuery('')
  }

  const selectWorkflow = (w: WorkflowType) => {
    setWorkflow(w)
    if (w === 'change-prospect' || w === 'change-client') {
      setStep('select-item')
    } else {
      setStep('list')
    }
  }

  const getWorkflowTitle = () => {
    const wf = WORKFLOW_OPTIONS.find(w => w.id === workflow)
    return wf?.title || 'Commercial Team Flow'
  }

  const getStepDetails = () => {
    if (workflow === 'change-prospect' || workflow === 'change-client') {
      switch (step) {
        case 'select-item':
          return { phase: 1, title: 'Select Account', desc: `Select a ${workflow === 'change-prospect' ? 'prospect' : 'client'} to move` }
        case 'change-parent':
          return { phase: 2, title: 'Change Parent', desc: 'Select new parent organization' }
        case 'access-impact':
          return { phase: 3, title: 'Access Impact', desc: 'Review access changes' }
        case 'change-success':
          return { phase: 3, title: 'Success', desc: 'Hierarchy changed!' }
        default:
          return { phase: 1, title: '', desc: '' }
      }
    }
    switch (step) {
      case 'list':
        return { phase: 1, title: 'Accounts List', desc: workflow === 'child-account' ? 'Select existing client' : 'Click "New" to create a new prospect' }
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

  // Workflow selector screen
  if (step === 'workflow-select') {
    return (
      <div className="demo-overlay">
        <div className="proposed-demo-modal workflow-selector-modal">
          <div className="proposed-demo-header">
            <h2>Commercial Team Workflows</h2>
            {fullscreen ? (
              <button className="btn btn-sm" onClick={onClose}>Close Window</button>
            ) : (
              <button className="demo-close" onClick={onClose}>×</button>
            )}
          </div>
          <div className="workflow-selector">
            <p className="workflow-selector-intro">Select a workflow to demo:</p>
            <div className="workflow-options">
              {WORKFLOW_OPTIONS.map(w => (
                <div
                  key={w.id}
                  className="workflow-option"
                  onClick={() => selectWorkflow(w.id)}
                >
                  <div className="workflow-option-icon">{w.icon}</div>
                  <div className="workflow-option-content">
                    <div className="workflow-option-title">{w.title}</div>
                    <div className="workflow-option-desc">{w.description}</div>
                  </div>
                  <div className="workflow-option-arrow">→</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="demo-overlay">
      <div className="proposed-demo-modal">
        {/* Header */}
        <div className="proposed-demo-header">
          <h2>{getWorkflowTitle()}</h2>
          {fullscreen ? (
            <button className="btn btn-sm" onClick={onClose}>Close Window</button>
          ) : (
            <button className="demo-close" onClick={onClose}>×</button>
          )}
        </div>

        <div className="proposed-demo-body">
          {/* Left Sidebar */}
          <div className="proposed-demo-sidebar">
            <div className="demo-nav-title">Workflow Steps</div>

            {(workflow === 'change-prospect' || workflow === 'change-client') ? (
              <>
                <div
                  className={`demo-nav-item ${stepDetails.phase === 1 ? 'active' : ''} ${stepDetails.phase > 1 ? 'completed' : ''}`}
                  onClick={() => setStep('select-item')}
                >
                  <div className="demo-nav-number">1</div>
                  <div className="demo-nav-info">
                    <div className="demo-nav-label">Select {workflow === 'change-prospect' ? 'Prospect' : 'Client'}</div>
                    <div className="demo-nav-system">Salesforce</div>
                    {stepDetails.phase === 1 && (
                      <div className="demo-nav-substep">{stepDetails.title}</div>
                    )}
                  </div>
                </div>
                <div
                  className={`demo-nav-item ${stepDetails.phase === 2 ? 'active' : ''} ${stepDetails.phase > 2 ? 'completed' : ''}`}
                  onClick={() => selectedAccountForChange ? setStep('change-parent') : null}
                  style={{ cursor: selectedAccountForChange ? 'pointer' : 'not-allowed', opacity: selectedAccountForChange ? 1 : 0.5 }}
                >
                  <div className="demo-nav-number">2</div>
                  <div className="demo-nav-info">
                    <div className="demo-nav-label">Change Parent</div>
                    <div className="demo-nav-system">Product Tool</div>
                    {stepDetails.phase === 2 && (
                      <div className="demo-nav-substep">{stepDetails.title}</div>
                    )}
                  </div>
                </div>
                <div
                  className={`demo-nav-item ${stepDetails.phase === 3 ? 'active' : ''}`}
                  style={{ opacity: stepDetails.phase >= 3 ? 1 : 0.5 }}
                >
                  <div className="demo-nav-number">3</div>
                  <div className="demo-nav-info">
                    <div className="demo-nav-label">Confirm Changes</div>
                    <div className="demo-nav-system">Access Impact</div>
                    {stepDetails.phase === 3 && (
                      <div className="demo-nav-substep">{stepDetails.title}</div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div
                  className={`demo-nav-item ${stepDetails.phase === 1 ? 'active' : ''} ${getStepNumber() > 1 ? 'completed' : ''}`}
                  onClick={() => setStep('list')}
                >
                  <div className="demo-nav-number">1</div>
                  <div className="demo-nav-info">
                    <div className="demo-nav-label">{workflow === 'child-account' ? 'Select Existing Client' : 'Create Prospect'}</div>
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
                    <div className="demo-nav-label">{workflow === 'child-account' ? 'Add Child Account' : 'Convert to Client'}</div>
                    <div className="demo-nav-system">CSR / Product Account</div>
                    {stepDetails.phase === 2 && (
                      <div className="demo-nav-substep">{stepDetails.title}</div>
                    )}
                  </div>
                </div>
              </>
            )}

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
                      value={formData.parentKey}
                      onChange={e => {
                        const val = e.target.value
                        if (val === '') {
                          setFormData({ ...formData, parentKey: '', parentAccount: '', ultimateParentOrgId: '', parentOrgId: '' })
                        } else if (val === 'northwell-child') {
                          setFormData({ ...formData, parentKey: val, parentAccount: 'Northwell Health (Child Org)', ultimateParentOrgId: 'org_northwell', parentOrgId: 'org_northwell_child' })
                        } else if (val === 'northwell') {
                          setFormData({ ...formData, parentKey: val, parentAccount: 'Northwell Health', ultimateParentOrgId: 'org_northwell', parentOrgId: '' })
                        } else if (val === 'lifestance') {
                          setFormData({ ...formData, parentKey: val, parentAccount: 'LifeStance Health', ultimateParentOrgId: 'org_lifestance', parentOrgId: '' })
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
                      {formData.ultimateParentOrgId && !formData.parentOrgId && '→ Add a new child practice under an existing org'}
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
                        <span>{formData.parentAccount || '—'}</span>
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

        {/* CSR Wizard: Create Org - Uses actual app modal structure */}
        {step === 'csr-org' && (
          <div className="proposed-demo-screen org-mgmt-screen">
            {/* Org Management App Preview (dimmed background) */}
            <div className="org-mgmt-preview">
              <div className="preview-header">
                <div className="preview-logo">
                  <div className="preview-logo-icon">Z</div>
                  <span>Zocdoc</span>
                </div>
                <nav className="preview-nav">
                  <span className="preview-nav-item">Home</span>
                  <span className="preview-nav-item active">Org Management</span>
                  <span className="preview-nav-item">Providers</span>
                </nav>
              </div>
              <div className="preview-page-header">
                <h1>Organization Management</h1>
              </div>
              <div className="preview-tabs">
                <button className="preview-tab active">Org Hierarchy</button>
                <button className="preview-tab">Workflow Comparison</button>
              </div>
              <div className="preview-content"></div>
            </div>

            {/* Actual Create New Client Modal */}
            <div className="modal-overlay demo-modal-active">
              <div className="modal new-client-wizard wide-modal">
                <div className="modal-header">
                  <h2>{workflow === 'child-account' ? 'Add Child Account Under Existing Org' : 'Create New Client'}</h2>
                  <button className="modal-close" onClick={() => setStep('detail')}>×</button>
                </div>

                <div className="modal-body split-view">
                  {/* Left: Hierarchy Preview */}
                  <div className="split-left">
                    <div className="org-hierarchy-preview">
                      <div className="hierarchy-preview-title">Organization Hierarchy</div>
                      {workflow === 'child-account' ? (
                        <div className="hierarchy-preview-tree">
                          {(() => {
                            const parent = EXISTING_PARENT_ORGS.find(o => o.id === csrParentOrg)
                            return (
                              <>
                                <div className={`hierarchy-node org-node ${parent ? 'existing-parent' : 'unselected'}`}>
                                  <span className="node-icon">🏢</span>
                                  <span className="node-name">{parent ? parent.name : 'Select a parent organization…'}</span>
                                  {parent && <span className="type-badge ultimate">{parent.segment}</span>}
                                  {parent && <span className="existing-badge">Existing</span>}
                                </div>
                                <div style={{ marginLeft: 20 }}>
                                  <span className="hierarchy-connector">└─</span>
                                  <div className="hierarchy-node practice-node new-practice" style={{ display: 'inline-flex', marginLeft: 4 }}>
                                    <span className="node-icon">🏥</span>
                                    <span className="node-name">{csrPracticeData.name || 'New Child Account'}</span>
                                    <span className="type-badge practice">Practice</span>
                                    <span className="new-badge">← Creating here</span>
                                  </div>
                                </div>
                              </>
                            )
                          })()}
                        </div>
                      ) : (
                        <div className="hierarchy-preview-tree">
                          <div className="hierarchy-node org-node">
                            <span className="node-icon">🏢</span>
                            <span className="node-name">TunaHealth</span>
                            <span className="type-badge ultimate">LPG</span>
                          </div>
                          <div style={{ marginLeft: 20 }}>
                            <span className="hierarchy-connector">└─</span>
                            <div className="hierarchy-node practice-node new-practice" style={{ display: 'inline-flex', marginLeft: 4 }}>
                              <span className="node-icon">🏥</span>
                              <span className="node-name">TunaHealth Practice</span>
                              <span className="type-badge practice">Practice</span>
                              <span className="new-badge">← Creating here</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Form */}
                  <div className="split-right">
                    {workflow === 'child-account' ? (
                      <div className="form-section">
                        <h4>Parent Organization</h4>
                        <div className="form-group">
                          <label>Parent Organization * <span className="hint-badge">Sets hierarchy</span></label>
                          <select
                            value={csrParentOrg}
                            onChange={e => setCsrParentOrg(e.target.value)}
                            className="sf-select"
                          >
                            <option value="">-- Select an existing organization --</option>
                            {EXISTING_PARENT_ORGS.map(org => (
                              <option key={org.id} value={org.id}>{org.name} ({org.segment})</option>
                            ))}
                          </select>
                          <span className="sf-hint">The new account will be created as a child under this organization.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="form-section">
                        <h4>Organization</h4>
                        <div className="form-group">
                          <label>Organization Name * <span className="locked-badge">🔒 From Salesforce</span></label>
                          <input
                            type="text"
                            value="TunaHealth"
                            disabled
                            className="locked-input"
                          />
                        </div>
                        <div className="form-group">
                          <label>Segment * <span className="locked-badge">🔒 From Salesforce</span></label>
                          <select value="LargeProviderGroup" disabled className="locked-input">
                            <option value="HealthSystem">Health System (HS)</option>
                            <option value="LargeProviderGroup">Large Provider Group (LPG)</option>
                            <option value="MidMarket">Mid-Market (MM)</option>
                            <option value="Local">Local</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="form-section">
                      <div className="form-group practice-toggle">
                        <label className="checkbox-label">
                          <input type="checkbox" checked disabled />
                          <span>Add a practice under this organization</span>
                        </label>
                      </div>

                      <div className="form-group">
                        <label>Practice Name *</label>
                        <input
                          type="text"
                          value={csrPracticeData.name}
                          placeholder="Enter practice name"
                          onChange={e => setCsrPracticeData({ ...csrPracticeData, name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Products</label>
                        <div className="product-checkboxes">
                          {AVAILABLE_PRODUCTS.map(product => (
                            <label key={product.value} className="product-checkbox">
                              <input type="checkbox" />
                              <span>{product.label}{product.free && <span className="product-free-badge">Free</span>}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setStep('detail')}>Cancel</button>
                  <button
                    className="btn btn-primary"
                    onClick={handleOrgCreated}
                    disabled={workflow === 'child-account' && !csrParentOrg}
                  >
                    {workflow === 'child-account' ? 'Add Child Account' : 'Create Client'}
                  </button>
                </div>
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
                      {[
                        { label: 'Bookable Presence', free: true },
                        { label: 'Marketplace' },
                        { label: 'Practice Solutions' },
                      ].map(product => (
                        <label key={product.label} className="product-checkbox">
                          <input
                            type="checkbox"
                            checked={csrPracticeData.products.includes(product.label)}
                            onChange={e => {
                              if (e.target.checked) {
                                setCsrPracticeData({ ...csrPracticeData, products: [...csrPracticeData.products, product.label] })
                              } else {
                                setCsrPracticeData({ ...csrPracticeData, products: csrPracticeData.products.filter(p => p !== product.label) })
                              }
                            }}
                          />
                          <span>
                            {product.label}
                            {product.free && <span className="product-free-badge">Free</span>}
                          </span>
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

        {/* Org Created - Shows Org Management with created hierarchy */}
        {step === 'org-created' && (
          <div className="proposed-demo-screen org-mgmt-result">
            {/* Full Org Management App */}
            <div className="org-mgmt-full">
              {/* App Header */}
              <div className="preview-header">
                <div className="preview-logo">
                  <div className="preview-logo-icon">Z</div>
                  <span>Zocdoc</span>
                </div>
                <nav className="preview-nav">
                  <span className="preview-nav-item">Home</span>
                  <span className="preview-nav-item active">Org Management</span>
                  <span className="preview-nav-item">Providers</span>
                </nav>
              </div>

              {/* Page Header */}
              <div className="preview-page-header">
                <h1>Organization Management</h1>
                <button className="btn btn-outline">+ Create New Client</button>
              </div>

              {/* View Tabs */}
              <div className="preview-tabs">
                <button className="preview-tab active">Org Hierarchy</button>
                <button className="preview-tab">Workflow Comparison</button>
              </div>

              {/* Content with Created Org */}
              <div className="org-mgmt-content">
                <div className="org-search-bar">
                  <label>Search</label>
                  <input type="text" value="TunaHealth" readOnly className="search-filled" />
                </div>

                {/* Hierarchy Section */}
                <div className="org-hierarchy-result">
                  <div className="hierarchy-header-result">
                    <h2>Organization Hierarchy</h2>
                    <div className="hierarchy-ids">
                      <span>Organization ID: {createdOrgId}</span>
                    </div>
                  </div>

                  {/* Success Banner */}
                  <div className="creation-success-banner">
                    <span className="success-check">✓</span>
                    <span>Organization "TunaHealth" and practice "TunaHealth Practice" created successfully!</span>
                  </div>

                  {/* Hierarchy Tree */}
                  <div className="org-tree-result">
                    <div className="demo-tree-node org selected">
                      <span className="demo-tree-expand">▼</span>
                      <span className="demo-tree-icon">🏢</span>
                      <span className="demo-tree-name">TunaHealth</span>
                      <span className="demo-tree-badge lpg">LPG</span>
                      <span className="demo-tree-new">NEW</span>
                    </div>
                    <div className="demo-tree-children">
                      <div className="demo-tree-node practice">
                        <span className="demo-tree-icon">🏥</span>
                        <span className="demo-tree-name">TunaHealth Practice</span>
                        <span className="demo-tree-products">Bookable Presence, Marketplace</span>
                        <span className="demo-tree-new">NEW</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="hierarchy-actions">
                    <button className="btn btn-action">Add Practice</button>
                    <button className="btn btn-action">Add Child Org</button>
                    <button className="btn btn-action">Change Parent</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Demo Complete Overlay */}
            <div className="demo-complete-bar">
              <span className="complete-text">✓ Demo Complete - Client created in Org Management</span>
              <button className="btn btn-primary" onClick={resetDemo}>Start Over</button>
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

        {/* Hierarchy Change: Select Item */}
        {step === 'select-item' && (
          <div className="proposed-demo-screen">
            <div className="sf-header">
              <div className="sf-header-left">
                <span className="sf-cloud-icon">☁️</span>
                <span className="sf-title">Sales Console</span>
                <span className="sf-subtitle">Accounts</span>
              </div>
            </div>
            <div className="sf-page">
              <div className="sf-page-header">
                <div className="sf-page-title">
                  <span className="sf-icon">📋</span>
                  <span>Select {workflow === 'change-prospect' ? 'Prospect' : 'Client'} to Move</span>
                </div>
              </div>
              <div className="sf-filter-bar">
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="sf-filter-input"
                />
              </div>
              <div className="hierarchy-select-list">
                {filteredAccounts.map(account => (
                  <div
                    key={account.id}
                    className={`hierarchy-select-item ${selectedAccountForChange?.id === account.id ? 'selected' : ''}`}
                    onClick={() => setSelectedAccountForChange(account)}
                  >
                    <div className="hierarchy-select-radio">
                      <input
                        type="radio"
                        name="selectAccount"
                        checked={selectedAccountForChange?.id === account.id}
                        onChange={() => setSelectedAccountForChange(account)}
                      />
                    </div>
                    <div className="hierarchy-select-info">
                      <div className="hierarchy-select-name">{account.name}</div>
                      <div className="hierarchy-select-meta">
                        <span className="segment-badge">{account.segment}</span>
                        {account.isActive && <span className="status-badge active">Active</span>}
                        {!account.isActive && <span className="status-badge prospect">Prospect</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hierarchy-select-actions">
                <button className="btn btn-sf" onClick={resetDemo}>Cancel</button>
                <button
                  className="btn btn-sf-primary"
                  onClick={() => setStep('change-parent')}
                  disabled={!selectedAccountForChange}
                >
                  Next: Select New Parent →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hierarchy Change: Change Parent */}
        {step === 'change-parent' && selectedAccountForChange && (
          <div className="proposed-demo-screen">
            <div className="change-parent-screen">
              <div className="change-parent-header">
                <h3>Change Parent for: {selectedAccountForChange.name}</h3>
                <p>Current Segment: {selectedAccountForChange.segment}</p>
              </div>
              <div className="change-parent-content">
                <div className="current-hierarchy-box">
                  <h4>Current Hierarchy</h4>
                  <div className="hierarchy-tree-mini">
                    <div className="hierarchy-node-mini root">
                      <span className="node-icon">🏢</span>
                      <span>Root Organization</span>
                    </div>
                    <div className="hierarchy-node-mini current" style={{ marginLeft: 24 }}>
                      <span className="hierarchy-connector">└─</span>
                      <span className="node-icon">{workflow === 'change-client' ? '🏥' : '📋'}</span>
                      <span>{selectedAccountForChange.name}</span>
                      <span className="current-badge">← Current</span>
                    </div>
                    {workflow === 'change-client' && (
                      <div className="hierarchy-node-mini child" style={{ marginLeft: 48 }}>
                        <span className="hierarchy-connector">└─</span>
                        <span className="node-icon">🏥</span>
                        <span>Child Practice (will move with parent)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="new-parent-selection">
                  <h4>Select New Parent Organization</h4>
                  <div className="parent-options">
                    {['Northwell Health', 'LifeStance Health', 'Privia Health', 'Orlando Health'].map(parent => (
                      <label
                        key={parent}
                        className={`parent-option ${newParentAccount === parent ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="newParent"
                          value={parent}
                          checked={newParentAccount === parent}
                          onChange={e => setNewParentAccount(e.target.value)}
                        />
                        <span className="parent-option-icon">🏢</span>
                        <span className="parent-option-name">{parent}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {newParentAccount && (
                  <div className="new-hierarchy-preview">
                    <h4>New Hierarchy Preview</h4>
                    <div className="hierarchy-tree-mini">
                      <div className="hierarchy-node-mini root">
                        <span className="node-icon">🏢</span>
                        <span>{newParentAccount}</span>
                        <span className="new-parent-badge">← New Parent</span>
                      </div>
                      <div className="hierarchy-node-mini moved" style={{ marginLeft: 24 }}>
                        <span className="hierarchy-connector">└─</span>
                        <span className="node-icon">{workflow === 'change-client' ? '🏥' : '📋'}</span>
                        <span>{selectedAccountForChange.name}</span>
                        <span className="moved-badge">← Will Move Here</span>
                      </div>
                      {workflow === 'change-client' && (
                        <div className="hierarchy-node-mini child" style={{ marginLeft: 48 }}>
                          <span className="hierarchy-connector">└─</span>
                          <span className="node-icon">🏥</span>
                          <span>Child Practice</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="change-parent-actions">
                <button className="btn btn-sf" onClick={() => setStep('select-item')}>← Back</button>
                <button
                  className="btn btn-sf-primary"
                  onClick={() => setStep('access-impact')}
                  disabled={!newParentAccount}
                >
                  Preview Access Impact →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hierarchy Change: Access Impact */}
        {step === 'access-impact' && selectedAccountForChange && (
          <div className="proposed-demo-screen">
            <div className="access-impact-screen">
              <div className="access-impact-header">
                <h3>Access Impact Preview</h3>
                <p>Moving <strong>{selectedAccountForChange.name}</strong> to <strong>{newParentAccount}</strong></p>
              </div>
              <div className="access-impact-body">
                <div className="impact-section gaining">
                  <h4>
                    <span className="impact-icon">✓</span>
                    Users who will gain access (3)
                  </h4>
                  <div className="impact-users">
                    <div className="impact-user">
                      <div className="user-avatar">L</div>
                      <div className="user-info">
                        <div className="user-name">Lisa Park</div>
                        <div className="user-email">lisa.park@{newParentAccount.toLowerCase().replace(/\s/g, '')}.com</div>
                      </div>
                      <div className="user-role">Admin</div>
                    </div>
                    <div className="impact-user">
                      <div className="user-avatar">D</div>
                      <div className="user-info">
                        <div className="user-name">David Williams</div>
                        <div className="user-email">d.williams@{newParentAccount.toLowerCase().replace(/\s/g, '')}.com</div>
                      </div>
                      <div className="user-role">Manager</div>
                    </div>
                    <div className="impact-user">
                      <div className="user-avatar">E</div>
                      <div className="user-info">
                        <div className="user-name">Emily Brown</div>
                        <div className="user-email">ebrown@zocdoc.com</div>
                      </div>
                      <div className="user-role">Super Admin</div>
                    </div>
                  </div>
                </div>

                <div className="impact-section losing">
                  <h4>
                    <span className="impact-icon">✗</span>
                    Users who will lose access (2)
                  </h4>
                  <div className="impact-users">
                    <div className="impact-user">
                      <div className="user-avatar">J</div>
                      <div className="user-info">
                        <div className="user-name">John Smith</div>
                        <div className="user-email">john.smith@oldorg.com</div>
                      </div>
                      <div className="user-role">Admin</div>
                    </div>
                    <div className="impact-user">
                      <div className="user-avatar">S</div>
                      <div className="user-info">
                        <div className="user-name">Sarah Johnson</div>
                        <div className="user-email">sarah.j@oldorg.com</div>
                      </div>
                      <div className="user-role">Manager</div>
                    </div>
                  </div>
                </div>

                {workflow === 'change-client' && (
                  <div className="impact-section children">
                    <h4>
                      <span className="impact-icon">📎</span>
                      Child items that will also move (2)
                    </h4>
                    <div className="child-items">
                      <div className="child-item">
                        <span className="child-icon">🏥</span>
                        <span>{selectedAccountForChange.name} - Main Practice</span>
                      </div>
                      <div className="child-item">
                        <span className="child-icon">🏥</span>
                        <span>{selectedAccountForChange.name} - Satellite Office</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="access-impact-actions">
                <button className="btn btn-sf" onClick={() => setStep('change-parent')}>← Back</button>
                <button className="btn btn-sf-primary" onClick={() => setStep('change-success')}>
                  Confirm Move
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hierarchy Change: Success */}
        {step === 'change-success' && selectedAccountForChange && (
          <div className="proposed-demo-screen">
            <div className="demo-success">
              <div className="success-icon">✓</div>
              <h3>Hierarchy Changed Successfully!</h3>
              <p>{selectedAccountForChange.name} has been moved to {newParentAccount}</p>
              <div className="success-details">
                <div className="success-detail">
                  <label>Account Moved</label>
                  <span>{selectedAccountForChange.name}</span>
                </div>
                <div className="success-detail">
                  <label>New Parent</label>
                  <span>{newParentAccount}</span>
                </div>
                <div className="success-detail">
                  <label>Users Gained Access</label>
                  <span>3 users</span>
                </div>
                <div className="success-detail">
                  <label>Users Lost Access</label>
                  <span>2 users</span>
                </div>
                {workflow === 'change-client' && (
                  <div className="success-detail">
                    <label>Child Items Moved</label>
                    <span>2 practices</span>
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

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

type ViewMode = 'org-management' | 'current-workflow' | 'proposed-workflow'

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
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleCreateOrg = (newOrg: Partial<Organization>) => {
    const org: Organization = {
      id: `org_${Math.random().toString(36).substr(2, 12)}`,
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
      id: `org_${Math.random().toString(36).substr(2, 12)}`,
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

  const handleAddPractice = (practice: { name: string; npi?: string; products?: ProductType[] }) => {
    if (!selectedOrg) return

    const targetOrgId = selectedItems.size === 1
      ? Array.from(selectedItems)[0]
      : selectedOrg.id

    const newPractice: Practice = {
      id: `p_${Math.random().toString(36).substr(2, 12)}`,
      name: practice.name,
      npi: practice.npi,
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
          onClick={() => handleSelectOrg(org)}
        >
          <div className="tree-select">
            <input
              type="checkbox"
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
              >
                <div className="tree-select">
                  <input
                    type="checkbox"
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
                + New Ultimate Parent Org
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
            className={`view-tab ${viewMode === 'current-workflow' ? 'active' : ''}`}
            onClick={() => setViewMode('current-workflow')}
          >
            Current Workflow
          </button>
          <button
            className={`view-tab ${viewMode === 'proposed-workflow' ? 'active' : ''}`}
            onClick={() => setViewMode('proposed-workflow')}
          >
            Proposed Workflow
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {viewMode === 'current-workflow' && <CurrentWorkflow />}
        {viewMode === 'proposed-workflow' && <ProposedWorkflow />}
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
                  <span className="selection-count">{selectedItems.size} selected</span>
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

      {/* Create Org Modal */}
      {showCreateOrgModal && (
        <Modal title="Create New Ultimate Parent Organization" onClose={() => setShowCreateOrgModal(false)}>
          <div className="modal-hint">
            This creates a top-level organization with no parent. To add a child organization, first search for and select an existing parent org, then use "Add Child Org".
          </div>
          <OrgForm
            onSubmit={handleCreateOrg}
            onCancel={() => setShowCreateOrgModal(false)}
            submitLabel="Create Ultimate Parent"
            isUltimateParent={true}
          />
        </Modal>
      )}

      {/* Add Child Org Modal */}
      {showAddChildModal && selectedOrg && (
        <Modal title={`Add Child Organization`} onClose={() => setShowAddChildModal(false)}>
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
        <Modal title={`Add Practice`} onClose={() => setShowAddPracticeModal(false)}>
          <PracticeForm
            onSubmit={handleAddPractice}
            onCancel={() => setShowAddPracticeModal(false)}
          />
        </Modal>
      )}

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

// Practice Form Component
function PracticeForm({ onSubmit, onCancel }: { onSubmit: (data: { name: string; npi?: string; products?: ProductType[] }) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [npi, setNpi] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<Set<ProductType>>(new Set())

  const toggleProduct = (product: ProductType) => {
    setSelectedProducts(prev => {
      const next = new Set(prev)
      if (next.has(product)) {
        next.delete(product)
      } else {
        next.add(product)
      }
      return next
    })
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      onSubmit({
        name,
        npi: npi || undefined,
        products: selectedProducts.size > 0 ? Array.from(selectedProducts) : undefined
      })
    }}>
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
      <div className="form-group">
        <label>Products</label>
        <div className="product-checkboxes">
          {AVAILABLE_PRODUCTS.map(product => (
            <label key={product.value} className="product-checkbox">
              <input
                type="checkbox"
                checked={selectedProducts.has(product.value)}
                onChange={() => toggleProduct(product.value)}
              />
              <span>{product.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={!name.trim()}>Add Practice</button>
      </div>
    </form>
  )
}

// Current Workflow Component
function CurrentWorkflow() {
  const [expandedImages, setExpandedImages] = useState<Set<number>>(new Set())

  const toggleImage = (stepNumber: number) => {
    setExpandedImages(prev => {
      const next = new Set(prev)
      if (next.has(stepNumber)) {
        next.delete(stepNumber)
      } else {
        next.add(stepNumber)
      }
      return next
    })
  }

  const steps = [
    {
      number: 1,
      system: 'Salesforce',
      title: 'Create Account',
      description: 'Click "New" on Accounts list to create a new account',
      details: [
        'Click "New" button on Accounts list',
        'Select account type: Practice, Business Development, or Health System',
        'Fill in Account Name (required), Account Segment, Parent Account',
        'Leave Parent Account blank for ultimate parent org'
      ],
      icon: '☁️',
      images: [
        { src: '/images/workflow/step1a-accounts-list.png', caption: '1a: Click "New" on Accounts list' },
        { src: '/images/workflow/step1b-select-type.png', caption: '1b: Select account type (Health System)' },
        { src: '/images/workflow/step1c-account-form.png', caption: '1c: Fill account form (Name, Segment, Parent)' }
      ]
    },
    {
      number: 2,
      system: 'Salesforce',
      title: 'Set Parent Hierarchy',
      description: 'Link to parent organization if this is a child org',
      details: [
        'Search for existing parent account',
        'Select to establish hierarchy relationship',
        'Skip this step for ultimate parent orgs'
      ],
      icon: '🔗',
      images: [
        { src: '/images/workflow/step2-parent-hierarchy.png', caption: 'Select parent account' }
      ]
    },
    {
      number: 3,
      system: 'Salesforce',
      title: 'Go to Related Tab',
      description: 'Navigate to the Related tab on the new account',
      details: [
        'View related objects: Contacts, Contracts, CSR Practice Locations',
        'Access Account Team, Account Issues, Projects'
      ],
      icon: '📋',
      images: [
        { src: '/images/workflow/step3-related-tab.png', caption: 'Related tab view' }
      ]
    },
    {
      number: 4,
      system: 'Salesforce',
      title: 'Create Strategic Contact',
      description: 'Add business contact (C-level executive or non-doctor)',
      details: [
        'Click "New" in Contacts section',
        'Select "Strategic" record type for business contacts',
        'Enter First Name, Last Name, Title, Position',
        'Account Name auto-populated'
      ],
      icon: '👤',
      images: [
        { src: '/images/workflow/step4a-contacts.png', caption: 'Click Contacts' },
        { src: '/images/workflow/step4b-new-contact.png', caption: 'Click New' },
        { src: '/images/workflow/step4c-record-type.png', caption: 'Select Strategic' },
        { src: '/images/workflow/step4d-contact-form.png', caption: 'Fill contact details' }
      ]
    },
    {
      number: 5,
      system: 'CSR (Retool)',
      title: 'Create Account in CSR',
      description: 'Use Doctor Sign Up tool to create practice in CSR',
      details: [
        'Copy Classic URL from Salesforce account page',
        'Go to Doctor Sign Up tool in Retool',
        'Paste Salesforce Account URL',
        'Click "Sign Up" (first attempt shows "forbidden access" error - click again)'
      ],
      icon: '🔧',
      images: [
        { src: '/images/workflow/step5a-copy-url.png', caption: 'Copy Classic URL from Salesforce' },
        { src: '/images/workflow/step5b-csr-signup.png', caption: 'Paste URL and Sign Up' }
      ],
      painPoint: 'Manual copy/paste between systems, error on first attempt'
    }
  ]

  return (
    <div className="workflow-container">
      <div className="workflow-header">
        <h2>Current Workflow: Salesforce → CSR</h2>
        <p className="workflow-subtitle">Creating an organization and linking it to the Zocdoc system</p>
        <div className="workflow-systems">
          <span className="system-badge salesforce">Salesforce</span>
          <span className="system-arrow">→</span>
          <span className="system-badge csr">CSR (Retool)</span>
          <span className="system-arrow">→</span>
          <span className="system-badge pogs">POGS</span>
        </div>
      </div>

      <div className="workflow-timeline">
        {steps.map((step, index) => (
          <div key={step.number} className="workflow-step">
            <div className="step-connector">
              <div className="step-number">{step.number}</div>
              {index < steps.length - 1 && <div className="step-line" />}
            </div>
            <div className={`step-content ${step.painPoint ? 'has-pain-point' : ''}`}>
              <div className="step-header">
                <span className="step-icon">{step.icon}</span>
                <span className={`step-system ${step.system.toLowerCase().replace(/[^a-z]/g, '')}`}>
                  {step.system}
                </span>
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
              <ul className="step-details">
                {step.details.map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
              {step.images && step.images.length > 0 && (
                <div className="step-image-container">
                  <button
                    className="step-image-toggle"
                    onClick={() => toggleImage(step.number)}
                  >
                    {expandedImages.has(step.number) ? '▼ Hide Screenshots' : `▶ View Screenshots (${step.images.length})`}
                  </button>
                  {expandedImages.has(step.number) && (
                    <div className="step-images-grid">
                      {step.images.map((img, i) => (
                        <div key={i} className="step-image-wrapper">
                          <img
                            src={img.src}
                            alt={img.caption}
                            className="step-image"
                            onError={(e) => {
                              (e.target as HTMLImageElement).parentElement!.style.display = 'none'
                            }}
                          />
                          <div className="step-image-caption">{img.caption}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {step.painPoint && (
                <div className="pain-point">
                  <span className="pain-icon">⚠️</span>
                  <span>{step.painPoint}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="workflow-summary">
        <h3>Pain Points</h3>
        <ul className="pain-points-list">
          <li><strong>Multiple systems:</strong> Salesforce → CSR (Retool) → POGS</li>
          <li><strong>Manual data transfer:</strong> Copy/paste URLs between systems</li>
          <li><strong>Error-prone:</strong> "Forbidden access" error on first signup attempt</li>
          <li><strong>No visibility:</strong> Org hierarchy not visible until synced to POGS</li>
          <li><strong>Disconnected:</strong> Changes in Salesforce don't auto-sync to org hierarchy</li>
        </ul>
      </div>
    </div>
  )
}

// Proposed Workflow Component
function ProposedWorkflow() {
  const currentSteps = [
    { system: 'Salesforce', action: 'Create Account', time: '2-3 min' },
    { system: 'Salesforce', action: 'Set Parent Hierarchy', time: '1 min' },
    { system: 'Salesforce', action: 'Create Contact', time: '2 min' },
    { system: 'CSR', action: 'Copy URL & Sign Up', time: '2-3 min' },
    { system: 'POGS', action: 'Verify Sync', time: '? min' },
  ]

  const proposedSteps = [
    { system: 'Org Management', action: 'Create/Search Org', time: '1 min' },
    { system: 'Org Management', action: 'Set Hierarchy', time: '30 sec' },
    { system: 'Auto', action: 'Sync to POGS + Salesforce', time: 'Instant' },
  ]

  return (
    <div className="workflow-container">
      <div className="workflow-header">
        <h2>Proposed Workflow: Unified Org Management</h2>
        <p className="workflow-subtitle">Single entry point with automated sync to all systems</p>
      </div>

      <div className="comparison-container">
        {/* Current State */}
        <div className="comparison-column current">
          <h3>Current State</h3>
          <div className="comparison-systems">
            <span className="system-badge salesforce">Salesforce</span>
            <span className="system-badge csr">CSR</span>
            <span className="system-badge pogs">POGS</span>
          </div>
          <div className="comparison-steps">
            {currentSteps.map((step, i) => (
              <div key={i} className="comparison-step">
                <span className={`mini-badge ${step.system.toLowerCase()}`}>{step.system}</span>
                <span className="step-action">{step.action}</span>
                <span className="step-time">{step.time}</span>
              </div>
            ))}
          </div>
          <div className="comparison-total">
            <strong>Total time:</strong> 8-10+ minutes
          </div>
          <div className="comparison-issues">
            <div className="issue">❌ Manual copy/paste</div>
            <div className="issue">❌ Multiple logins</div>
            <div className="issue">❌ Error-prone</div>
            <div className="issue">❌ No hierarchy visibility</div>
          </div>
        </div>

        {/* Arrow */}
        <div className="comparison-arrow">
          <span>→</span>
        </div>

        {/* Proposed State */}
        <div className="comparison-column proposed">
          <h3>Proposed State</h3>
          <div className="comparison-systems">
            <span className="system-badge org-mgmt">Org Management</span>
          </div>
          <div className="comparison-steps">
            {proposedSteps.map((step, i) => (
              <div key={i} className="comparison-step">
                <span className={`mini-badge ${step.system.toLowerCase().replace(' ', '-')}`}>{step.system}</span>
                <span className="step-action">{step.action}</span>
                <span className="step-time">{step.time}</span>
              </div>
            ))}
          </div>
          <div className="comparison-total">
            <strong>Total time:</strong> ~2 minutes
          </div>
          <div className="comparison-benefits">
            <div className="benefit">✓ Single entry point</div>
            <div className="benefit">✓ Visual hierarchy editor</div>
            <div className="benefit">✓ Real-time sync</div>
            <div className="benefit">✓ Audit trail</div>
          </div>
        </div>
      </div>

      {/* Integration Diagram */}
      <div className="integration-diagram">
        <h3>System Integration</h3>
        <div className="diagram-flow">
          <div className="diagram-box primary">
            <div className="box-icon">🏢</div>
            <div className="box-title">Org Management</div>
            <div className="box-subtitle">Single Source of Truth</div>
          </div>
          <div className="diagram-arrows">
            <div className="arrow-branch">
              <span className="arrow-label">Reads/Writes</span>
              <span className="arrow-line">↔</span>
              <div className="diagram-box secondary">
                <div className="box-icon">🗄️</div>
                <div className="box-title">POGS</div>
                <div className="box-subtitle">DynamoDB</div>
              </div>
            </div>
            <div className="arrow-branch">
              <span className="arrow-label">Syncs</span>
              <span className="arrow-line">↔</span>
              <div className="diagram-box secondary">
                <div className="box-icon">☁️</div>
                <div className="box-title">Salesforce</div>
                <div className="box-subtitle">CRM</div>
              </div>
            </div>
            <div className="arrow-branch">
              <span className="arrow-label">Streams</span>
              <span className="arrow-line">→</span>
              <div className="diagram-box secondary">
                <div className="box-icon">❄️</div>
                <div className="box-title">Cistern</div>
                <div className="box-subtitle">Snowflake</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

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
  const [lightboxImage, setLightboxImage] = useState<{ src: string; caption: string } | null>(null)

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
        'Fill in Account Name (required), Account Segment, Parent Account'
      ],
      icon: '☁️',
      images: [
        { src: `${import.meta.env.BASE_URL}images/workflow/step1a-accounts-list.png`, caption: '1a: Click "New" on Accounts list' },
        { src: `${import.meta.env.BASE_URL}images/workflow/step1b-select-type.png`, caption: '1b: Select account type (Health System)' },
        { src: `${import.meta.env.BASE_URL}images/workflow/step1c-account-form.png`, caption: '1c: Fill account form (Name, Segment, Parent)' }
      ]
    },
    {
      number: 2,
      system: 'Salesforce',
      title: 'Create Strategic Contact',
      description: 'Add business contact (C-level executive or non-doctor)',
      details: [
        'Go to Related tab on the account',
        'Click Contacts section',
        'Click "New" to create contact',
        'Select "Strategic" record type for business contacts',
        'Enter First Name, Last Name, Title, Position'
      ],
      icon: '👤',
      images: [
        { src: `${import.meta.env.BASE_URL}images/workflow/step2a-related-tab.png`, caption: '2a: Go to Related tab' },
        { src: `${import.meta.env.BASE_URL}images/workflow/step2b-contacts.png`, caption: '2b: Click Contacts' },
        { src: `${import.meta.env.BASE_URL}images/workflow/step2c-new-contact.png`, caption: '2c: Click New' },
        { src: `${import.meta.env.BASE_URL}images/workflow/step2d-record-type.png`, caption: '2d: Select Strategic record type' },
        { src: `${import.meta.env.BASE_URL}images/workflow/step2e-contact-form.png`, caption: '2e: Fill contact details' }
      ]
    },
    {
      number: 3,
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
        { src: `${import.meta.env.BASE_URL}images/workflow/step3a-copy-url.png`, caption: '3a: Copy Classic URL from Salesforce' },
        { src: `${import.meta.env.BASE_URL}images/workflow/step3b-csr-signup.png`, caption: '3b: Paste URL and Sign Up' }
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
          <div key={step.number} className={`workflow-step ${expandedImages.has(step.number) ? 'expanded' : ''}`}>
            <div className="step-connector">
              <div className="step-number">{step.number}</div>
              {index < steps.length - 1 && <div className="step-line" />}
            </div>
            <div className={`step-content ${step.painPoint ? 'has-pain-point' : ''}`}>
              <div
                className="step-header-clickable"
                onClick={() => toggleImage(step.number)}
              >
                <div className="step-header-left">
                  <span className="step-expand-icon">
                    {expandedImages.has(step.number) ? '▼' : '▶'}
                  </span>
                  <span className="step-icon">{step.icon}</span>
                  <span className={`step-system ${step.system.toLowerCase().replace(/[^a-z]/g, '')}`}>
                    {step.system}
                  </span>
                  <h3 className="step-title">{step.title}</h3>
                </div>
                <span className="step-screenshot-count">
                  {step.images?.length || 0} screenshots
                </span>
              </div>

              {expandedImages.has(step.number) && (
                <div className="step-expanded-content">
                  <p className="step-description">{step.description}</p>
                  <ul className="step-details">
                    {step.details.map((detail, i) => (
                      <li key={i}>{detail}</li>
                    ))}
                  </ul>
                  {step.painPoint && (
                    <div className="pain-point">
                      <span className="pain-icon">⚠️</span>
                      <span>{step.painPoint}</span>
                    </div>
                  )}
                  {step.images && step.images.length > 0 && (
                    <div className="step-images-grid">
                      {step.images.map((img, i) => (
                        <div
                          key={i}
                          className="step-image-wrapper clickable"
                          onClick={() => setLightboxImage(img)}
                        >
                          <img
                            src={img.src}
                            alt={img.caption}
                            className="step-image"
                            onError={(e) => {
                              (e.target as HTMLImageElement).parentElement!.style.display = 'none'
                            }}
                          />
                          <div className="step-image-caption">{img.caption}</div>
                          <div className="image-zoom-hint">Click to enlarge</div>
                        </div>
                      ))}
                    </div>
                  )}
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

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxImage(null)}>×</button>
            <img src={lightboxImage.src} alt={lightboxImage.caption} className="lightbox-image" />
            <div className="lightbox-caption">{lightboxImage.caption}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Commercial Team Demo Component
type DemoStep = 'list' | 'type-modal' | 'form' | 'detail' | 'success'
type AccountType = 'Practice' | 'BusinessDevelopment' | 'HealthSystem'

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
    website: '',
    phone: '',
    territory: '',
  })
  const [searchQuery, setSearchQuery] = useState('')

  const filteredAccounts = searchQuery
    ? MOCK_ACCOUNTS.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : MOCK_ACCOUNTS

  const getStepNumber = () => {
    switch (step) {
      case 'list': case 'type-modal': return 1
      case 'form': return 2
      case 'detail': case 'success': return 3
    }
  }

  const getStepLabel = () => {
    switch (step) {
      case 'list': case 'type-modal': return 'Start with Prospect'
      case 'form': return 'Create Account'
      case 'detail': case 'success': return 'Convert to Product Account'
    }
  }

  const resetDemo = () => {
    setStep('list')
    setSelectedType('HealthSystem')
    setFormData({
      accountName: '',
      accountSegment: 'Health System',
      parentAccount: '',
      website: '',
      phone: '',
      territory: '',
    })
    setSearchQuery('')
  }

  return (
    <div className="demo-overlay" onClick={onClose}>
      <div className="demo-container" onClick={e => e.stopPropagation()}>
        {/* Demo Header */}
        <div className="demo-header">
          <div className="demo-header-left">
            <h2>Commercial Team Flow: New Client</h2>
            <div className="demo-progress">
              <div className={`progress-step ${getStepNumber() >= 1 ? 'active' : ''} ${getStepNumber() > 1 ? 'completed' : ''}`}>
                <span className="progress-num">1</span>
                <span className="progress-label">Start with Prospect</span>
              </div>
              <div className="progress-connector" />
              <div className={`progress-step ${getStepNumber() >= 2 ? 'active' : ''} ${getStepNumber() > 2 ? 'completed' : ''}`}>
                <span className="progress-num">2</span>
                <span className="progress-label">Create Account</span>
              </div>
              <div className="progress-connector" />
              <div className={`progress-step ${getStepNumber() >= 3 ? 'active' : ''}`}>
                <span className="progress-num">3</span>
                <span className="progress-label">Convert to Product Account</span>
              </div>
            </div>
          </div>
          <button className="demo-close" onClick={onClose}>×</button>
        </div>

        {/* Step 1: Accounts List */}
        {step === 'list' && (
          <div className="demo-content">
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
                  {filteredAccounts.map((account, idx) => (
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
          <div className="demo-content">
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
          <div className="demo-content">
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
                    <input type="text" placeholder="Search Accounts..." className="sf-input" />
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
          <div className="demo-content">
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
                  <button className="btn btn-sf-csr" onClick={() => setStep('success')}>Create CSR Account</button>
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

        {/* Success State */}
        {step === 'success' && (
          <div className="demo-content">
            <div className="demo-success">
              <div className="success-icon">✓</div>
              <h3>CSR Account Created Successfully!</h3>
              <p>The account has been created in CSR and synced to POGS.</p>
              <div className="success-details">
                <div className="success-detail">
                  <label>Account Name</label>
                  <span>{formData.accountName || 'New Health System Account'}</span>
                </div>
                <div className="success-detail">
                  <label>Practice ID</label>
                  <span>PRC-{Math.floor(100000 + Math.random() * 900000)}</span>
                </div>
                <div className="success-detail">
                  <label>POGS ID</label>
                  <span>org_{Math.random().toString(36).substr(2, 12)}</span>
                </div>
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
  )
}

// Proposed Workflow Component
function ProposedWorkflow() {
  const [showDemo, setShowDemo] = useState(false)

  return (
    <div className="workflow-container">
      <div className="workflow-header">
        <h2>Proposed Workflow: Unified Org Management</h2>
        <p className="workflow-subtitle">Two user flows with single entry point and automated sync</p>
      </div>

      {/* Two Flow Sections */}
      <div className="proposed-flows">
        {/* Commercial Team Flow */}
        <div className="flow-section">
          <div className="flow-header commercial">
            <span className="flow-icon">💼</span>
            <h3>Commercial Team Flow</h3>
            <span className="flow-badge">Internal</span>
          </div>

          <div className="flow-scenario">
            <div className="scenario-header">
              <div className="scenario-title">New Client</div>
              <button className="btn btn-demo" onClick={() => setShowDemo(true)}>Try Demo</button>
            </div>
            <div className="scenario-steps">
              <div className="flow-step">
                <span className="flow-step-num">1</span>
                <span className="flow-step-text">Start with Prospect</span>
              </div>
              <span className="flow-arrow">→</span>
              <div className="flow-step">
                <span className="flow-step-num">2</span>
                <span className="flow-step-text">Create Account</span>
              </div>
              <span className="flow-arrow">→</span>
              <div className="flow-step">
                <span className="flow-step-num">3</span>
                <span className="flow-step-text">Convert to Product Account</span>
              </div>
            </div>
          </div>

          <div className="flow-scenario">
            <div className="scenario-title">Existing Client Expansion</div>
            <div className="scenario-steps">
              <div className="flow-step">
                <span className="flow-step-num">1</span>
                <span className="flow-step-text">Create Child Prospect</span>
              </div>
              <span className="flow-arrow">→</span>
              <div className="flow-step">
                <span className="flow-step-num">2</span>
                <span className="flow-step-text">Create Child Account</span>
              </div>
              <span className="flow-arrow">→</span>
              <div className="flow-step">
                <span className="flow-step-num">3</span>
                <span className="flow-step-text">Convert to Product Account</span>
              </div>
            </div>
          </div>
        </div>

      {/* Demo Modal */}
      {showDemo && <CommercialTeamDemo onClose={() => setShowDemo(false)} />}

        {/* Customer Flow */}
        <div className="flow-section">
          <div className="flow-header customer">
            <span className="flow-icon">👥</span>
            <h3>Customer Flow</h3>
            <span className="flow-badge">External</span>
          </div>

          <div className="flow-scenario">
            <div className="scenario-title">After Initial Org Setup</div>
            <div className="scenario-steps">
              <div className="flow-step">
                <span className="flow-step-num">1</span>
                <span className="flow-step-text">Create New Child Org</span>
              </div>
              <span className="flow-arrow">→</span>
              <div className="flow-step">
                <span className="flow-step-num">2</span>
                <span className="flow-step-text">Add Child Practices</span>
              </div>
            </div>
            <div className="scenario-note">
              Customer can manage their own org hierarchy within their scoped organization
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="flow-benefits">
        <h3>Key Benefits</h3>
        <div className="benefits-grid">
          <div className="benefit-card">
            <span className="benefit-icon">🎯</span>
            <div className="benefit-title">Single Entry Point</div>
            <div className="benefit-desc">One tool for both internal teams and customers</div>
          </div>
          <div className="benefit-card">
            <span className="benefit-icon">🔄</span>
            <div className="benefit-title">Auto Sync</div>
            <div className="benefit-desc">Changes sync to POGS, Salesforce, and Cistern</div>
          </div>
          <div className="benefit-card">
            <span className="benefit-icon">👁️</span>
            <div className="benefit-title">Visual Hierarchy</div>
            <div className="benefit-desc">See and edit org structure in real-time</div>
          </div>
          <div className="benefit-card">
            <span className="benefit-icon">📋</span>
            <div className="benefit-title">Audit Trail</div>
            <div className="benefit-desc">Track all changes with user attribution</div>
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

import { useState, useMemo } from 'react'
import { Organization } from './types'
import { mockOrganizations, mockAuditHistory, mockMembers } from './data/mockData'
import OrgTree from './components/OrgTree'
import DetailPanel from './components/DetailPanel'
import CreateOrgModal from './components/CreateOrgModal'
import EditOrgModal from './components/EditOrgModal'

function App() {
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [organizations, setOrganizations] = useState(mockOrganizations)

  const filteredOrgs = useMemo(() => {
    if (!searchQuery.trim()) return organizations

    const query = searchQuery.toLowerCase()

    const filterOrg = (org: Organization): Organization | null => {
      const matches = org.name.toLowerCase().includes(query) ||
                     org.salesforceId?.toLowerCase().includes(query) ||
                     org.city?.toLowerCase().includes(query)

      const filteredChildren = org.children?.map(filterOrg).filter(Boolean) as Organization[] | undefined

      if (matches || (filteredChildren && filteredChildren.length > 0)) {
        return { ...org, children: filteredChildren }
      }
      return null
    }

    return organizations.map(filterOrg).filter(Boolean) as Organization[]
  }, [organizations, searchQuery])

  const handleCreateOrg = (newOrg: Partial<Organization>) => {
    const org: Organization = {
      id: `org-new-${Date.now()}`,
      name: newOrg.name || 'New Organization',
      type: newOrg.type || 'Local',
      city: newOrg.city,
      state: newOrg.state,
      owner: newOrg.owner,
    }
    setOrganizations([...organizations, org])
    setShowCreateModal(false)
  }

  const handleEditOrg = (updatedOrg: Partial<Organization>) => {
    if (!selectedOrg) return

    const updateOrg = (org: Organization): Organization => {
      if (org.id === selectedOrg.id) {
        return { ...org, ...updatedOrg }
      }
      if (org.children) {
        return { ...org, children: org.children.map(updateOrg) }
      }
      return org
    }

    setOrganizations(organizations.map(updateOrg))
    setSelectedOrg({ ...selectedOrg, ...updatedOrg })
    setShowEditModal(false)
  }

  const findOrgPath = (orgId: string, orgs: Organization[] = organizations, path: Organization[] = []): Organization[] => {
    for (const org of orgs) {
      if (org.id === orgId) {
        return [...path, org]
      }
      if (org.children) {
        const found = findOrgPath(orgId, org.children, [...path, org])
        if (found.length > 0) return found
      }
    }
    return []
  }

  const breadcrumb = selectedOrg ? findOrgPath(selectedOrg.id) : []

  return (
    <div className="app">
      <header className="header">
        <h1>Org Management</h1>
        <div className="header-actions">
          <input
            type="text"
            className="search-input"
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + New Org
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="tree-panel">
          {filteredOrgs.length > 0 ? (
            <OrgTree
              organizations={filteredOrgs}
              selectedId={selectedOrg?.id}
              onSelect={setSelectedOrg}
            />
          ) : (
            <div className="no-results">
              No organizations found matching "{searchQuery}"
            </div>
          )}
        </div>

        <div className={`detail-panel ${!selectedOrg ? 'empty' : ''}`}>
          {selectedOrg ? (
            <DetailPanel
              organization={selectedOrg}
              breadcrumb={breadcrumb}
              auditHistory={mockAuditHistory[selectedOrg.id] || []}
              members={mockMembers[selectedOrg.id] || []}
              onEdit={() => setShowEditModal(true)}
              onSelectOrg={setSelectedOrg}
              allOrganizations={organizations}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🏢</div>
              <p>Select an organization to view details</p>
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <CreateOrgModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateOrg}
        />
      )}

      {showEditModal && selectedOrg && (
        <EditOrgModal
          organization={selectedOrg}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditOrg}
        />
      )}
    </div>
  )
}

export default App

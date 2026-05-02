import { useState, useMemo } from 'react'
import { Organization, Practice, FlowState } from './types'
import { mockOrganizations } from './data/mockData'
import HomePage from './components/HomePage'
import CreateOrgPage from './components/CreateOrgPage'
import CreateOrgSuccessPage from './components/CreateOrgSuccessPage'
import AddChildChoicePage from './components/AddChildChoicePage'
import AddChildOrgPage from './components/AddChildOrgPage'
import AddPracticePage from './components/AddPracticePage'
import SearchPage from './components/SearchPage'
import SearchResultsPage from './components/SearchResultsPage'
import OrgDetailPage from './components/OrgDetailPage'
import SuccessPage from './components/SuccessPage'

function App() {
  const [flowState, setFlowState] = useState<FlowState>({ step: 'home' })
  const [organizations, setOrganizations] = useState(mockOrganizations)
  const [practices, setPractices] = useState<Practice[]>([])

  const goTo = (step: FlowState['step'], extras?: Partial<FlowState>) => {
    setFlowState({ ...flowState, step, ...extras })
  }

  const goHome = () => {
    setFlowState({ step: 'home' })
  }

  const handleCreateOrg = (newOrg: Partial<Organization>) => {
    const org: Organization = {
      id: `org-${Date.now()}`,
      name: newOrg.name || 'New Organization',
      type: newOrg.type || 'Local',
      city: newOrg.city,
      state: newOrg.state,
      owner: newOrg.owner,
      salesforceId: newOrg.salesforceId,
      children: [],
    }
    setOrganizations([...organizations, org])
    goTo('create-org-success', { currentOrg: org })
  }

  const handleAddChildOrg = (parentOrg: Organization, childOrg: Partial<Organization>) => {
    const newChild: Organization = {
      id: `org-${Date.now()}`,
      name: childOrg.name || 'New Child Org',
      type: childOrg.type || 'Local',
      city: childOrg.city,
      state: childOrg.state,
      owner: childOrg.owner,
      parentId: parentOrg.id,
      children: [],
    }

    const addChildToOrg = (org: Organization): Organization => {
      if (org.id === parentOrg.id) {
        return { ...org, children: [...(org.children || []), newChild] }
      }
      if (org.children) {
        return { ...org, children: org.children.map(addChildToOrg) }
      }
      return org
    }

    setOrganizations(organizations.map(addChildToOrg))
    goTo('success', { currentOrg: newChild, parentOrg })
  }

  const handleAddPractice = (parentOrg: Organization, practice: Partial<Practice>) => {
    const newPractice: Practice = {
      id: `practice-${Date.now()}`,
      name: practice.name || 'New Practice',
      npi: practice.npi,
      address: practice.address,
      city: practice.city,
      state: practice.state,
      parentOrgId: parentOrg.id,
    }
    setPractices([...practices, newPractice])
    goTo('success', { currentOrg: parentOrg })
  }

  const searchOrgs = (query: string): Organization[] => {
    if (!query.trim()) return []

    const q = query.toLowerCase()
    const results: Organization[] = []

    const searchInOrg = (org: Organization) => {
      if (
        org.name.toLowerCase().includes(q) ||
        org.salesforceId?.toLowerCase().includes(q) ||
        org.city?.toLowerCase().includes(q)
      ) {
        results.push(org)
      }
      org.children?.forEach(searchInOrg)
    }

    organizations.forEach(searchInOrg)
    return results
  }

  const findOrgById = (id: string): Organization | undefined => {
    const search = (orgs: Organization[]): Organization | undefined => {
      for (const org of orgs) {
        if (org.id === id) return org
        if (org.children) {
          const found = search(org.children)
          if (found) return found
        }
      }
      return undefined
    }
    return search(organizations)
  }

  const getPracticesForOrg = (orgId: string): Practice[] => {
    return practices.filter(p => p.parentOrgId === orgId)
  }

  const renderStep = () => {
    switch (flowState.step) {
      case 'home':
        return (
          <HomePage
            onCreateNew={() => goTo('create-org')}
            onSearch={() => goTo('search')}
          />
        )

      case 'create-org':
        return (
          <CreateOrgPage
            onBack={goHome}
            onCreate={handleCreateOrg}
          />
        )

      case 'create-org-success':
        return (
          <CreateOrgSuccessPage
            organization={flowState.currentOrg!}
            onAddChild={() => goTo('add-child-choice', { parentOrg: flowState.currentOrg })}
            onDone={goHome}
          />
        )

      case 'add-child-choice':
        return (
          <AddChildChoicePage
            parentOrg={flowState.parentOrg!}
            onAddChildOrg={() => goTo('add-child-org')}
            onAddPractice={() => goTo('add-practice')}
            onBack={() => {
              if (flowState.currentOrg) {
                goTo('create-org-success', { currentOrg: flowState.parentOrg })
              } else {
                goTo('org-detail', { currentOrg: flowState.parentOrg })
              }
            }}
          />
        )

      case 'add-child-org':
        return (
          <AddChildOrgPage
            parentOrg={flowState.parentOrg!}
            onBack={() => goTo('add-child-choice')}
            onCreate={(childOrg) => handleAddChildOrg(flowState.parentOrg!, childOrg)}
          />
        )

      case 'add-practice':
        return (
          <AddPracticePage
            parentOrg={flowState.parentOrg!}
            onBack={() => goTo('add-child-choice')}
            onCreate={(practice) => handleAddPractice(flowState.parentOrg!, practice)}
          />
        )

      case 'search':
        return (
          <SearchPage
            onBack={goHome}
            onSearch={(query) => goTo('search-results', { searchQuery: query })}
          />
        )

      case 'search-results':
        const results = searchOrgs(flowState.searchQuery || '')
        return (
          <SearchResultsPage
            query={flowState.searchQuery || ''}
            results={results}
            onBack={() => goTo('search')}
            onSelect={(org) => goTo('org-detail', { currentOrg: org })}
          />
        )

      case 'org-detail':
        return (
          <OrgDetailPage
            organization={flowState.currentOrg!}
            practices={getPracticesForOrg(flowState.currentOrg!.id)}
            onBack={() => goTo('search-results')}
            onAddChild={() => goTo('add-child-choice', { parentOrg: flowState.currentOrg })}
            onSelectChild={(child) => goTo('org-detail', { currentOrg: child })}
          />
        )

      case 'success':
        return (
          <SuccessPage
            message={flowState.currentOrg ? `Added to ${flowState.parentOrg?.name || 'organization'}` : 'Success!'}
            onAddAnother={() => goTo('add-child-choice', { parentOrg: flowState.parentOrg })}
            onDone={goHome}
          />
        )

      default:
        return <HomePage onCreateNew={() => goTo('create-org')} onSearch={() => goTo('search')} />
    }
  }

  return (
    <div className="app">
      {renderStep()}
    </div>
  )
}

export default App

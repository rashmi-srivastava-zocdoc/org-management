import { useState } from 'react'
import { Organization, OrgType } from '../types'

interface AddChildOrgPageProps {
  parentOrg: Organization
  onBack: () => void
  onCreate: (org: Partial<Organization>) => void
}

function AddChildOrgPage({ parentOrg, onBack, onCreate }: AddChildOrgPageProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<OrgType>('LargeProviderGroup')
  const [city, setCity] = useState(parentOrg.city || '')
  const [state, setState] = useState(parentOrg.state || '')
  const [owner, setOwner] = useState(parentOrg.owner || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({ name, type, city, state, owner })
  }

  return (
    <div className="page">
      <header className="page-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="page-header-content">
          <h1>Add Child Organization</h1>
          <p>Adding to: {parentOrg.name}</p>
        </div>
      </header>

      <main className="page-content">
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="parent-indicator">
            <span className="parent-label">Parent Organization</span>
            <span className="parent-name">{parentOrg.name}</span>
          </div>

          <div className="form-group">
            <label htmlFor="name">Organization Name *</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Huntington Hospital"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Organization Type *</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as OrgType)}
            >
              <option value="LargeProviderGroup">Large Provider Group</option>
              <option value="MidMarket">Mid-Market</option>
              <option value="Local">Local</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Huntington"
              />
            </div>

            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                type="text"
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g., NY"
                maxLength={2}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="owner">Account Owner</label>
            <input
              type="text"
              id="owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Inherited from parent"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onBack}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              Add Child Organization →
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default AddChildOrgPage

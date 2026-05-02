import { useState } from 'react'
import { Organization, OrgType } from '../types'

interface CreateOrgPageProps {
  onBack: () => void
  onCreate: (org: Partial<Organization>) => void
}

function CreateOrgPage({ onBack, onCreate }: CreateOrgPageProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<OrgType>('HealthSystem')
  const [salesforceId, setSalesforceId] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [owner, setOwner] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({ name, type, salesforceId, city, state, owner })
  }

  return (
    <div className="page">
      <header className="page-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="page-header-content">
          <h1>Create New Organization</h1>
          <p>Step 1 of 2: Enter organization details</p>
        </div>
      </header>

      <main className="page-content">
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Organization Name *</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Northwell Health"
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
              <option value="HealthSystem">Health System</option>
              <option value="LargeProviderGroup">Large Provider Group</option>
              <option value="MidMarket">Mid-Market</option>
              <option value="Local">Local</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="salesforceId">Salesforce ID</label>
            <input
              type="text"
              id="salesforceId"
              value={salesforceId}
              onChange={(e) => setSalesforceId(e.target.value)}
              placeholder="e.g., 01260000"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Great Neck"
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
              placeholder="e.g., Lucy Prom"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onBack}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              Create Organization →
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default CreateOrgPage

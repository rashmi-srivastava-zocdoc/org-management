import { useState } from 'react'
import { Organization, Practice } from '../types'

interface AddPracticePageProps {
  parentOrg: Organization
  onBack: () => void
  onCreate: (practice: Partial<Practice>) => void
}

function AddPracticePage({ parentOrg, onBack, onCreate }: AddPracticePageProps) {
  const [name, setName] = useState('')
  const [npi, setNpi] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState(parentOrg.city || '')
  const [state, setState] = useState(parentOrg.state || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({ name, npi, address, city, state })
  }

  return (
    <div className="page">
      <header className="page-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="page-header-content">
          <h1>Add Practice</h1>
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
            <label htmlFor="name">Practice Name *</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Great Neck Family Medicine"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="npi">NPI Number</label>
            <input
              type="text"
              id="npi"
              value={npi}
              onChange={(e) => setNpi(e.target.value)}
              placeholder="e.g., 1234567890"
              maxLength={10}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Street Address</label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., 123 Main St"
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

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onBack}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              Add Practice →
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default AddPracticePage

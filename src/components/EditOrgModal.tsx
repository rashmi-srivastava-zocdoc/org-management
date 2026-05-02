import { useState } from 'react'
import { Organization, OrgType } from '../types'

interface EditOrgModalProps {
  organization: Organization
  onClose: () => void
  onSave: (org: Partial<Organization>) => void
}

function EditOrgModal({ organization, onClose, onSave }: EditOrgModalProps) {
  const [name, setName] = useState(organization.name)
  const [type, setType] = useState<OrgType>(organization.type)
  const [city, setCity] = useState(organization.city || '')
  const [state, setState] = useState(organization.state || '')
  const [owner, setOwner] = useState(organization.owner || '')
  const [salesforceId, setSalesforceId] = useState(organization.salesforceId || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ name, type, city, state, owner, salesforceId })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Organization</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="name">Organization Name *</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter organization name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Organization Type *</label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as OrgType)}
              >
                <option value="Local">Local</option>
                <option value="LargeProviderGroup">Large Provider Group</option>
                <option value="HealthSystem">Health System</option>
                <option value="MidMarket">Mid-Market</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="salesforceId">Salesforce ID</label>
              <input
                type="text"
                id="salesforceId"
                value={salesforceId}
                onChange={(e) => setSalesforceId(e.target.value)}
                placeholder="Enter Salesforce ID"
              />
            </div>

            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city"
              />
            </div>

            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                type="text"
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Enter state"
                maxLength={2}
              />
            </div>

            <div className="form-group">
              <label htmlFor="owner">Owner</label>
              <input
                type="text"
                id="owner"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Enter owner name"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditOrgModal

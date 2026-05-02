import { Organization } from '../types'

interface AddChildChoicePageProps {
  parentOrg: Organization
  onAddChildOrg: () => void
  onAddPractice: () => void
  onBack: () => void
}

function AddChildChoicePage({ parentOrg, onAddChildOrg, onAddPractice, onBack }: AddChildChoicePageProps) {
  return (
    <div className="page">
      <header className="page-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <div className="page-header-content">
          <h1>Add to {parentOrg.name}</h1>
          <p>What would you like to add?</p>
        </div>
      </header>

      <main className="page-content">
        <div className="choice-cards">
          <button className="choice-card" onClick={onAddChildOrg}>
            <div className="choice-icon">🏛️</div>
            <h2>Child Organization</h2>
            <p>Add a sub-organization like a hospital, department, or regional office</p>
            <div className="choice-examples">
              Examples: Hospital, Medical Center, Regional Division
            </div>
          </button>

          <button className="choice-card" onClick={onAddPractice}>
            <div className="choice-icon">🏥</div>
            <h2>Practice</h2>
            <p>Add a practice location with providers</p>
            <div className="choice-examples">
              Examples: Primary Care Practice, Specialty Clinic
            </div>
          </button>
        </div>
      </main>
    </div>
  )
}

export default AddChildChoicePage

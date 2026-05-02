interface SuccessPageProps {
  message: string
  onAddAnother: () => void
  onDone: () => void
}

function SuccessPage({ message, onAddAnother, onDone }: SuccessPageProps) {
  return (
    <div className="page">
      <main className="page-content centered">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h1>Success!</h1>
          <p className="success-message">{message}</p>

          <div className="success-actions">
            <button className="btn btn-primary btn-large" onClick={onAddAnother}>
              ➕ Add Another
            </button>
            <button className="btn btn-secondary" onClick={onDone}>
              Done
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SuccessPage

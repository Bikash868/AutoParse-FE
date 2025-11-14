import { useEffect, useState } from 'react'
import './App.css'
import * as api from './api/candidates'
import { CandidateTable } from './components/candidate-table'
import { DocumentRequestModal } from './components/document-request-modal'
import { FileUpload } from './components/file-upload'

function App() {
  // Main data
  const [candidates, setCandidates] = useState<api.Candidate[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<api.CandidateDetails | null>(null)
  
  // Loading states
  const [loading, setLoading] = useState({ list: false, detail: false, action: false })
  
  // Messages
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Document upload form
  const [panCard, setPanCard] = useState<File | null>(null)
  const [aadharCard, setAadharCard] = useState<File | null>(null)
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')

  // Load candidates on mount
  useEffect(() => {
    async function loadCandidates() {
      setLoading(prev => ({ ...prev, list: true }))
      try {
        const data = await api.fetchCandidates()
        setCandidates(data)
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load candidates')
      } finally {
        setLoading(prev => ({ ...prev, list: false }))
      }
    }
    loadCandidates()
  }, [])

  // Load candidate details when selection changes
  useEffect(() => {
    if (!selectedId) {
      setSelectedCandidate(null)
      return
    }

    async function loadDetails() {
      setLoading(prev => ({ ...prev, detail: true }))
      try {
        const details = await api.fetchCandidateDetails(selectedId!)
        setSelectedCandidate(details)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load details')
      } finally {
        setLoading(prev => ({ ...prev, detail: false }))
      }
    }
    loadDetails()
  }, [selectedId])

  async function handleResumeUpload(file: File) {
    setError(null)
    setSuccess(null)
    try {
      const newCandidate = await api.uploadResume(file)
      const updated = await api.fetchCandidates()
      setCandidates(updated)
      if (newCandidate?.id) {
        setSelectedId(newCandidate.id)
      }
      setSuccess('Resume uploaded successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  async function handleRequestDocuments() {
    if (!selectedId) return
    
    setError(null)
    setRequestMessage('')
    setShowModal(true)
    setLoading(prev => ({ ...prev, action: true }))
    
    try {
      const response = await api.requestDocuments(selectedId)
      setRequestMessage(response.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate request')
      setShowModal(false)
    } finally {
      setLoading(prev => ({ ...prev, action: false }))
    }
  }

  function handleSendRequest(editedMessage: string) {
    // TODO: Implement actual send mail API when backend is ready
    // The editedMessage contains the HR's final version
    console.log('Sending email with message:', editedMessage)
    setSuccess('Document request sent successfully!')
    setShowModal(false)
    setRequestMessage('')
  }

  function handleCloseModal() {
    setShowModal(false)
    setRequestMessage('')
  }

  async function handleDocumentSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId) return
    if (!panCard && !aadharCard) {
      setError('Please select at least one document')
      return
    }

    setError(null)
    setSuccess(null)
    setLoading(prev => ({ ...prev, action: true }))
    try {
      const response = await api.submitDocuments(selectedId, { 
        panCard: panCard || undefined, 
        aadharCard: aadharCard || undefined 
      })
      setSuccess(response.message || 'Documents submitted!')
      setPanCard(null)
      setAadharCard(null)
      // Refresh candidate details
      const details = await api.fetchCandidateDetails(selectedId)
      setSelectedCandidate(details)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setLoading(prev => ({ ...prev, action: false }))
    }
  }

  function getStatus(candidate: api.Candidate) {
    return candidate.extractionStatus || candidate.status || 'Pending'
  }

  function getStatusClass(candidate: api.Candidate) {
    return getStatus(candidate).toLowerCase().replace(/[^a-z0-9]+/g, '-')
  }

  const confidenceScores = selectedCandidate?.confidenceScores || selectedCandidate?.confidence_scores || {}
  
  const skills = (() => {
    if (!selectedCandidate?.skills) return []
    if (Array.isArray(selectedCandidate.skills)) return selectedCandidate.skills
    return selectedCandidate.skills.split(',').map(s => s.trim()).filter(Boolean)
  })()

  const documents = selectedCandidate?.documents || []

  return (
    <>
      <DocumentRequestModal
        isOpen={showModal}
        message={requestMessage}
        loading={loading.action}
        onClose={handleCloseModal}
        onSend={handleSendRequest}
      />
      
      <div className="app-container">
        <header className="app-header">
          <div>
            <h1>AutoParse Dashboard</h1>
          </div>
          <div className="app-header-actions">
            <span className="app-badge">{candidates.length} candidates</span>
          </div>
        </header>

      <section className="app-section">
        <div className="section-header">
          <h2>1. Upload Candidate Resume</h2>
        </div>
        <FileUpload 
          handleDrag={() => {}} 
          handleDrop={() => {}} 
          handleFileUpload={handleResumeUpload} 
        />
        {error && <p className="app-error">{error}</p>}
        {success && <p className="app-success">{success}</p>}
      </section>

      <section className="app-section">
        <div className="section-header">
          <h2>2. Candidate Dashboard</h2>
          {loading.list && <span className="app-status">Loading...</span>}
        </div>
        <CandidateTable
          candidates={candidates}
          selectedCandidateId={selectedId}
          onCandidateSelect={setSelectedId}
          loading={loading.list}
          extractionStatus={getStatus}
          extractionStatusClassName={getStatusClass}
        />
      </section>

      <section className="app-section">
        <div className="section-header">
          <h2>3. Candidate Profile</h2>
          {loading.detail && <span className="app-status">Loading...</span>}
        </div>
        
        {!selectedCandidate ? (
          <p className="muted-text">Select a candidate to view their profile</p>
        ) : (
          <div className="profile-grid">
            <div className="profile-card">
              <h3>Identity</h3>
              <dl>
                <div><dt>Name</dt><dd>{selectedCandidate.name || '—'}</dd></div>
                <div><dt>Email</dt><dd>{selectedCandidate.email || '—'}</dd></div>
                <div><dt>Phone</dt><dd>{selectedCandidate.phone || '—'}</dd></div>
              </dl>
            </div>
            
            <div className="profile-card">
              <h3>Employment</h3>
              <dl>
                <div><dt>Company</dt><dd>{selectedCandidate.company || '—'}</dd></div>
                <div><dt>Designation</dt><dd>{selectedCandidate.designation || '—'}</dd></div>
                <div><dt>Status</dt><dd>{getStatus(selectedCandidate)}</dd></div>
              </dl>
            </div>
            
            <div className="profile-card">
              <h3>Skills</h3>
              {skills.length > 0 ? (
                <ul className="chip-list">
                  {skills.map(skill => <li key={skill}>{skill}</li>)}
                </ul>
              ) : (
                <p className="muted-text">No skills extracted</p>
              )}
            </div>
            
            <div className="profile-card">
              <h3>Confidence Scores</h3>
              {Object.keys(confidenceScores).length > 0 ? (
                <ul className="confidence-list">
                  {Object.entries(confidenceScores).map(([field, score]) => (
                    <li key={field}>
                      <span>{field}</span>
                      <span>{Math.round(Number(score) * 100) / 100}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted-text">No confidence data</p>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="app-section">
        <div className="section-header">
          <h2>4. Verification & Documents</h2>
        </div>

        <div className="verification-grid">
          <div className="verification-card">
            <h3>Request Identity Documents</h3>
            <p>AI agent will generate a personalized request for PAN and Aadhaar.</p>
            <button
              type="button"
              className="primary-button"
              disabled={!selectedId || loading.action}
              onClick={handleRequestDocuments}
            >
              {loading.action ? 'Sending...' : 'Trigger Document Request'}
            </button>
          </div>

          <div className="verification-card">
            <h3>Submitted Documents</h3>
            {documents.length > 0 ? (
              <ul className="documents-list">
                {documents.map((doc, i) => (
                  <li key={doc.id || i}>
                    <div>
                      <strong>{doc.type}</strong>
                      {doc.fileName && <span className="muted-text"> · {doc.fileName}</span>}
                    </div>
                    <div className="document-meta">
                      {doc.status && <span className="status-pill">{doc.status}</span>}
                      {doc.submittedAt && (
                        <span className="muted-text">
                          {new Date(doc.submittedAt).toLocaleString()}
                        </span>
                      )}
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noreferrer">View</a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted-text">No documents uploaded yet</p>
            )}
          </div>

          <div className="verification-card">
            <h3>Upload Documents Manually</h3>
            <form className="document-form" onSubmit={handleDocumentSubmit}>
              <label className="file-field">
                <span>PAN Card</span>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={e => setPanCard(e.target.files?.[0] || null)} 
                />
                <span className={panCard ? "file-selected" : "file-placeholder"}>
                  {panCard ? panCard.name : 'No file selected'}
                </span>
              </label>
              
              <label className="file-field">
                <span>Aadhaar Card</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={e => setAadharCard(e.target.files?.[0] || null)}
                />
                <span className={aadharCard ? "file-selected" : "file-placeholder"}>
                  {aadharCard ? aadharCard.name : 'No file selected'}
                </span>
              </label>
              
              <button
                type="submit"
                className="secondary-button"
                disabled={!selectedId || loading.action}
              >
                {loading.action ? 'Uploading...' : 'Submit Documents'}
              </button>
            </form>
          </div>
        </div>
      </section>
      </div>
    </>
  )
}

export default App

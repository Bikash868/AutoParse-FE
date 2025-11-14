import type { Candidate } from '../../api/candidates'
import './style.css'

type Props = {
  loading?: boolean
  candidates: Candidate[]
  selectedCandidateId: string | null
  onCandidateSelect: (id: string) => void
  extractionStatus: (candidate: Candidate) => string
  extractionStatusClassName: (candidate: Candidate) => string
}

export function CandidateTable({ 
  loading,
  candidates, 
  selectedCandidateId, 
  extractionStatus,
  onCandidateSelect, 
  extractionStatusClassName 
}: Props) {
  if (candidates.length === 0 && !loading) {
    return (
      <div className="candidate-table-wrapper">
        <table className="candidate-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} className="empty-state">
                No candidates yet. Upload a resume to get started.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="candidate-table-wrapper">
      <table className="candidate-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Company</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map(candidate => (
            <tr
              key={candidate.id}
              className={candidate.id === selectedCandidateId ? 'row-selected' : ''}
              onClick={() => onCandidateSelect(candidate.id)}
            >
              <td>{candidate.name || '—'}</td>
              <td>{candidate.email || '—'}</td>
              <td>{candidate.company || '—'}</td>
              <td>
                <span className={`status-pill status-${extractionStatusClassName(candidate)}`}>
                  {extractionStatus(candidate)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


const API_BASE_URL = 'https://autoparse-be.onrender.com'

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    throw new Error(message || `Request failed with status ${response.status}`)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

export type Candidate = {
  id: string
  name: string
  email: string
  company?: string
  extractionStatus?: string
  status?: string
  [key: string]: unknown
}

export type CandidateDetails = Candidate & {
  phone?: string
  designation?: string
  skills?: string[] | string
  confidenceScores?: Record<string, number>
  confidence_scores?: Record<string, number>
  documents?: SubmittedDocument[]
}

export type SubmittedDocument = {
  id?: string
  type: string
  fileName?: string
  file_url?: string
  submittedAt?: string
  status?: string
  [key: string]: unknown
}

export const uploadResume = async (file: File) => {
  const formData = new FormData()
  formData.append('resume', file)

  const response = await fetch(`${API_BASE_URL}/api/candidates/upload/`, {
    method: 'POST',
    body: formData
  })

  return handleResponse<Candidate>(response)
}

export const fetchCandidates = async () => {
  const response = await fetch(`${API_BASE_URL}/api/candidates/`)
  return handleResponse<Candidate[]>(response)
}

export const fetchCandidateDetails = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/api/candidates/${id}/`)
  return handleResponse<CandidateDetails>(response)
}

export const requestDocuments = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/api/candidates/${id}/request-documents/`, {
    method: 'POST'
  })

  return handleResponse<{ message: string }>(response)
}

export const submitDocuments = async (id: string, files: { panCard?: File; aadharCard?: File }) => {
  const formData = new FormData()
  if (files.panCard) {
    formData.append('pan_card', files.panCard)
  }
  if (files.aadharCard) {
    formData.append('aadhar_card', files.aadharCard)
  }

  const response = await fetch(`${API_BASE_URL}/api/candidates/${id}/submit-documents/`, {
    method: 'POST',
    body: formData
  })

  return handleResponse<{ message: string }>(response)
}


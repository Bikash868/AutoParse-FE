import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'

import './style.css'

const UploadIcon = () => (
  <svg
    className="file-upload-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    <polyline points="7 9 12 4 17 9" />
    <line x1="12" y1="4" x2="12" y2="16" />
  </svg>
)

type FileUploadProps = {
  handleDrag: (event: DragEvent<HTMLDivElement>) => void
  handleDrop: (event: DragEvent<HTMLDivElement>) => void
  handleFileUpload: (file: File) => void | Promise<void>
}

export const FileUpload = ({ handleDrag, handleDrop, handleFileUpload }: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const intervalRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
      }
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const clearTimers = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const finishUpload = () => {
    clearTimers()
    setUploadProgress(100)
    timeoutRef.current = window.setTimeout(() => {
      setUploading(false)
      setUploadProgress(0)
    }, 400)
  }

  const startSimulatedProgress = () => {
    clearTimers()
    intervalRef.current = window.setInterval(() => {
      setUploadProgress((previous) => {
        if (previous >= 95) {
          return previous
        }
        const nextValue = previous + 5
        return nextValue > 95 ? 95 : nextValue
      })
    }, 200)
  }

  const startUpload = (file: File) => {
    if (uploading) {
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setDragActive(false)
    startSimulatedProgress()

    Promise.resolve(handleFileUpload(file))
      .catch((error) => {
        console.error('File upload failed', error)
      })
      .finally(() => {
        finishUpload()
      })
  }

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      startUpload(file)
      event.target.value = ''
    }
  }

  const onDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(true)
    handleDrag(event)
  }

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!dragActive) {
      setDragActive(true)
    }
    handleDrag(event)
  }

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.currentTarget === event.target) {
      setDragActive(false)
    }
    handleDrag(event)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)

    const file = event.dataTransfer?.files?.[0]
    if (file) {
      startUpload(file)
    }

    handleDrop(event)
  }

  const dropzoneClasses = [
    'file-upload-dropzone',
    dragActive ? 'drag-active' : '',
    uploading ? 'uploading' : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={dropzoneClasses}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <UploadIcon />
      <h3 className="file-upload-title">{uploading ? 'Uploading Resume...' : 'Upload Candidate Resume'}</h3>
      <p className="file-upload-subtitle">Drag and drop a PDF or DOCX file, or click to browse</p>

      {uploading && (
        <div className="file-upload-progress-container">
          <div className="file-upload-progress-bar">
            <div className="file-upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
          </div>
          <p className="file-upload-progress-text">{uploadProgress}%</p>
        </div>
      )}

      <input
        type="file"
        accept=".pdf,.docx"
        onChange={onInputChange}
        className="file-upload-input"
        id="file-upload"
        disabled={uploading}
      />
      <label
        htmlFor="file-upload"
        className={`file-upload-button${uploading ? ' disabled' : ''}`}
        aria-disabled={uploading}
        onClick={(event) => {
          if (uploading) {
            event.preventDefault()
          }
        }}
      >
        Choose File
      </label>
    </div>
  )
}
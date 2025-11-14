import { useState, useEffect } from 'react'
import './style.css'

type Props = {
  isOpen: boolean
  message: string
  loading: boolean
  onClose: () => void
  onSend: (editedMessage: string) => void
}

export function DocumentRequestModal({ isOpen, message, loading, onClose, onSend }: Props) {
  const [editedMessage, setEditedMessage] = useState('')

  useEffect(() => {
    setEditedMessage(message)
  }, [message])

  if (!isOpen) return null

  const handleSend = () => {
    onSend(editedMessage)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Review & Edit Document Request</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <p className="modal-description">
            AI generated personalized message. You can edit and send the mail.
          </p>
          {loading && !message ? (
            <div className="message-preview loading">
              Generating personalized message...
            </div>
          ) : (
            <textarea
              className="message-editor"
              value={editedMessage}
              onChange={e => setEditedMessage(e.target.value)}
              placeholder="Message will appear here..."
              rows={10}
              disabled={loading}
            />
          )}
        </div>
        
        <div className="modal-footer">
          <button 
            className="modal-button cancel-button" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="modal-button send-button" 
            onClick={handleSend}
            disabled={loading || !editedMessage.trim()}
          >
            Send Mail
          </button>
        </div>
      </div>
    </div>
  )
}


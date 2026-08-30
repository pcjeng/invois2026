import { DOC_TYPES } from '../lib/docTypes'

// Pemilih jenis dokumen — modal bottom-sheet seperti skrin "Switch Document" rujukan.
export default function DocTypePicker({ current, onPick, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          Switch Document
          <button onClick={onClose} aria-label="tutup">✕</button>
        </div>
        {DOC_TYPES.map((t) => (
          <button key={t.id} className="picker-item" onClick={() => onPick(t.id)}>
            <span className="type-dot" style={{ background: t.color }} />
            <span>{t.label}</span>
            {current === t.id && <span className="check">✓</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

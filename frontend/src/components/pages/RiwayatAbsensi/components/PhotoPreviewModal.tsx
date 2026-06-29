import { X } from 'lucide-react';

interface PhotoPreviewModalProps {
  photoUrl: string;
  onClose: () => void;
}

export function PhotoPreviewModal({ photoUrl, onClose }: PhotoPreviewModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <button
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          color: '#f8fafc',
          background: 'rgba(30,41,59,0.8)',
          border: '1px solid rgba(148,163,184,0.2)',
          borderRadius: '12px',
          width: 44,
          height: 44,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s',
          zIndex: 71,
        }}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
          e.currentTarget.style.borderColor = '#ef4444';
          e.currentTarget.style.color = '#ef4444';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(30,41,59,0.8)';
          e.currentTarget.style.borderColor = 'rgba(148,163,184,0.2)';
          e.currentTarget.style.color = '#f8fafc';
        }}
      >
        <X size={20} />
      </button>

      <img
        src={photoUrl}
        alt="Photo Preview"
        style={{
          maxWidth: '100%',
          maxHeight: '90vh',
          objectFit: 'contain',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(148,163,184,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
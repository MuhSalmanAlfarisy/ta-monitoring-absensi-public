import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { borderRadius } from '../../../../lib/theme';

interface ViewPhotoModalProps {
  photoUrl: string;
  onClose: () => void;
}

export function ViewPhotoModal({ photoUrl, onClose }: ViewPhotoModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setIsZoomed(false);
  }, [photoUrl]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflow: 'hidden',
        cursor: 'zoom-out',
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'none', border: 'none',
          color: '#fff', cursor: 'pointer', zIndex: 10001,
        }}
      >
        <X size={32} />
      </button>
      <img
        src={photoUrl}
        alt="Profile Preview"
        style={{
          maxWidth: '100%',
          maxHeight: '90vh',
          borderRadius: borderRadius.md,
          objectFit: 'contain',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          transform: isZoomed ? 'scale(2)' : 'scale(1)',
          transition: 'transform 0.3s cubic-bezier(0.2, 0, 0.2, 1)',
          cursor: isZoomed ? 'zoom-out' : 'zoom-in',
        }}
        onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }}
      />
    </div>
  );
}
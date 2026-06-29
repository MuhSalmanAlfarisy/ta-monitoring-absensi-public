import { X } from 'lucide-react';

interface PhotoPreviewModalProps {
  photoUrl: string;
  nama: string;
  onClose: () => void;
}

export function PhotoPreviewModal({ photoUrl, nama, onClose }: PhotoPreviewModalProps) {
  return (
    <div
      className="fixed inset-0 !m-0 z-[70] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
        onClick={onClose}
      >
        <X className="w-8 h-8" />
      </button>
      <img
        src={photoUrl}
        alt={nama}
        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
import { useState } from 'react';
import { X, Save, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { colors, spacing, borderRadius, getThemeColors } from '../../../../lib/theme';
import { getCroppedImg } from '../../../../lib/image';

interface CropPhotoModalProps {
  theme: ReturnType<typeof getThemeColors>;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (blob: Blob) => Promise<void>;
}

export function CropPhotoModal({ theme, imageSrc, onClose, onCropComplete }: CropPhotoModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!croppedAreaPixels) return;
    setIsUploading(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!blob) throw new Error('Crop failed');
      await onCropComplete(blob);
    } catch (err) {
      console.error('Upload failed', err);
      alert('Gagal mengupload foto.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: spacing.md,
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: '500px',
          backgroundColor: theme.surface,
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          height: '80vh', maxHeight: '600px',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: spacing.md,
            borderBottom: `1px solid ${theme.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, color: theme.text.primary }}>Sesuaikan Foto</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.text.secondary }}>
            <X size={24} />
          </button>
        </div>

        {/* Cropper */}
        <div style={{ position: 'relative', flex: 1, backgroundColor: '#000' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={(_: any, pixels: any) => setCroppedAreaPixels(pixels)}
            onZoomChange={setZoom}
            cropShape="round"
            showGrid={false}
          />
        </div>

        {/* Controls */}
        <div style={{ padding: spacing.md, backgroundColor: theme.surface }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
            <ZoomOut size={20} color={theme.text.secondary} />
            <input
              type="range"
              value={zoom}
              min={1} max={3} step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ flex: 1, accentColor: colors.primary.main }}
            />
            <ZoomIn size={20} color={theme.text.secondary} />
          </div>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            style={{
              width: '100%', padding: '12px',
              backgroundColor: colors.primary.main,
              color: '#fff', border: 'none',
              borderRadius: borderRadius.md,
              fontWeight: 600, fontSize: '1rem',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: spacing.sm,
              opacity: isUploading ? 0.7 : 1,
            }}
          >
            {isUploading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            Simpan Foto
          </button>
        </div>
      </div>
    </div>
  );
}
import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Check, X } from 'lucide-react';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg');
}

const ImageCropper = ({ imageSrc, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column',
      zIndex: 1000, padding: '2rem'
    }}>
      <div style={{ position: 'relative', flex: 1, backgroundColor: '#333', borderRadius: '12px', overflow: 'hidden' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onCropComplete={onCropCompleteHandler}
          onZoomChange={setZoom}
          cropShape="round"
        />
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: '12px' }}>
        <span style={{ color: 'var(--text-muted)' }}>تصغير</span>
        <input 
          type="range" 
          value={zoom} 
          min={1} 
          max={3} 
          step={0.1} 
          onChange={(e) => setZoom(Number(e.target.value))} 
          style={{ width: '200px' }}
        />
        <span style={{ color: 'var(--text-muted)' }}>تكبير</span>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary" style={{ minWidth: '120px' }}>
          <X size={18} /> إلغاء
        </button>
        <button type="button" onClick={handleSave} className="btn btn-primary" style={{ minWidth: '120px' }}>
          <Check size={18} /> قص وحفظ
        </button>
      </div>
    </div>
  );
};

export default ImageCropper;

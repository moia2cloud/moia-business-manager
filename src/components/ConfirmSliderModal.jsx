import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';

const ConfirmSliderModal = ({ isOpen, onClose, onConfirm, title, description, sliderText = "اسحب للتأكيد" }) => {
  const [drag, setDrag] = useState(0);
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setDrag(0);
      setIsDragging(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePointerDown = (e) => {
    setIsDragging(true);
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !trackRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    const thumbWidth = 50; 
    const maxDrag = trackRect.width - thumbWidth - 4; // 4px padding
    
    let newDrag = e.clientX - trackRect.left - (thumbWidth / 2);
    
    if (newDrag < 0) newDrag = 0;
    if (newDrag > maxDrag) newDrag = maxDrag;
    
    setDrag(newDrag);
    
    // Auto confirm if reached 95%
    if (newDrag >= maxDrag * 0.95) {
      setIsDragging(false);
      onConfirm();
      onClose();
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    if (trackRef.current) {
      const trackRect = trackRef.current.getBoundingClientRect();
      const thumbWidth = 50;
      if (drag < trackRect.width - thumbWidth - 20) {
        setDrag(0); // Snap back
      }
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: '1rem', backdropFilter: 'blur(4px)' }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%', position: 'relative', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
          <X size={20} color="var(--text-muted)" />
        </button>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text)' }}>{title}</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>{description}</p>
        
        {/* Slider */}
        <div 
          ref={trackRef}
          style={{ height: '56px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '28px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span style={{ color: '#6b7280', fontSize: '0.95rem', fontWeight: 600, zIndex: 2, pointerEvents: 'none', opacity: Math.max(0, 1 - (drag / 100)), transition: 'opacity 0.2s' }}>{sliderText}</span>
          
          <div 
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${drag + 28}px`, backgroundColor: 'var(--accent)', zIndex: 1, transition: isDragging ? 'none' : 'width 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
          />

          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ 
              position: 'absolute', 
              left: `${drag + 2}px`, 
              top: '2px', 
              bottom: '2px', 
              width: '50px', 
              backgroundColor: 'var(--primary)', 
              borderRadius: '25px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: isDragging ? 'grabbing' : 'grab',
              touchAction: 'none',
              transition: isDragging ? 'none' : 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              zIndex: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            <ChevronRight size={24} color="white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmSliderModal;

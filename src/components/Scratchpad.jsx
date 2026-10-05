import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Eraser, Trash2, X, Minimize2, Maximize2 } from 'lucide-react';

export default function Scratchpad({ isOpen, onClose }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#38bdf8'); // Default neon cyan
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      // Store current drawing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(canvas, 0, 0);

      canvas.width = rect.width;
      canvas.height = rect.height;

      // Restore drawing
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isOpen, isMinimized]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.lineWidth = isEraser ? lineWidth * 6 : lineWidth;
    ctx.strokeStyle = isEraser ? '#121828' : color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  if (!isOpen) return null;

  // High-Tech Neon Pen Colors
  const colors = [
    { code: '#38bdf8', label: 'Neon Cyan' },
    { code: '#34d399', label: 'Electric Emerald' },
    { code: '#fbbf24', label: 'Amber Gold' },
    { code: '#f472b6', label: 'Laser Pink' },
    { code: '#a78bfa', label: 'Violet Glow' },
    { code: '#ffffff', label: 'Pure White' }
  ];

  return (
    <div className={`scratchpad-container ${isMinimized ? 'scratchpad-minimized' : ''}`}>
      <div className="scratchpad-header">
        <div className="scratchpad-title">
          <PenTool size={16} className="text-cyan-400" />
          <span>Жобалау дәптері (Math Scratchpad)</span>
        </div>

        <div className="scratchpad-controls">
          {!isMinimized && (
            <>
              {/* Color selector */}
              <div className="scratchpad-colors">
                {colors.map((c) => (
                  <button
                    key={c.code}
                    className={`color-dot ${color === c.code && !isEraser ? 'color-active' : ''}`}
                    style={{ backgroundColor: c.code }}
                    onClick={() => {
                      setColor(c.code);
                      setIsEraser(false);
                    }}
                    title={c.label}
                  />
                ))}
              </div>

              {/* Eraser */}
              <button
                className={`scratch-btn ${isEraser ? 'btn-active' : ''}`}
                onClick={() => setIsEraser(!isEraser)}
                title="Өшіргіш (Eraser)"
              >
                <Eraser size={14} />
              </button>

              {/* Clear */}
              <button className="scratch-btn" onClick={clearCanvas} title="Тазарту">
                <Trash2 size={14} />
              </button>
            </>
          )}

          {/* Minimize / Maximize */}
          <button
            className="scratch-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Үлкейту' : 'Кішірейту'}
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>

          {/* Close */}
          <button className="scratch-btn close-btn" onClick={onClose} title="Жабу">
            <X size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="scratchpad-body">
          <canvas
            ref={canvasRef}
            className="scratchpad-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <div className="scratchpad-hint">
            Интерактивті тақта: формуланы, сызбаны еркін жазып есептеңіз
          </div>
        </div>
      )}
    </div>
  );
}

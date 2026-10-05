import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Minimize2, 
  Download, 
  CheckCircle, 
  Clock, 
  Calendar, 
  BookOpen, 
  FolderArchive, 
  Check, 
  FileText,
  AlertCircle,
  Eye,
  Users,
  ChevronRight,
  Info
} from 'lucide-react';

export default function MaterialViewerModal({
  material,
  isOpen,
  onClose,
  activeStudent = null,
  onToggleSolve = null,
  isTeacher = false
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSolved, setIsSolved] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [isUpdatingSolve, setIsUpdatingSolve] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (material) {
      setZoom(1);
      setRotation(0);
      const studentId = activeStudent?.id;
      const solved = studentId && material.solvedStudents?.includes(studentId);
      setIsSolved(Boolean(solved));
      setSolvedCount(material.solvedStudents?.length || 0);

      // Increment view count on backend
      fetch(`/api/materials/${material.id}`)
        .catch(() => {});
    }
  }, [material, activeStudent]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen]);

  if (!isOpen || !material) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      exitFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen();
    }
    setIsFullscreen(false);
  };

  const handleToggleSolved = async () => {
    if (!activeStudent?.id || isUpdatingSolve) return;
    setIsUpdatingSolve(true);
    try {
      const res = await fetch(`/api/materials/${material.id}/toggle-solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: activeStudent.id })
      });
      const data = await res.json();
      if (data.success) {
        setIsSolved(data.isSolved);
        setSolvedCount(data.solvedCount);
        if (onToggleSolve) {
          onToggleSolve(material.id, data.isSolved, data.solvedCount);
        }
      }
    } catch (err) {
      console.error('Error toggling solved status:', err);
    } finally {
      setIsUpdatingSolve(false);
    }
  };

  // Format deadline and compute remaining time
  const formatDeadline = (dl) => {
    if (!dl) return null;
    const date = new Date(dl);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    const formattedDate = date.toLocaleDateString('kk-KZ', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });

    if (diff < 0) {
      return { text: formattedDate, status: 'expired', label: 'Мерзімі аяқталды' };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    let remText = '';
    if (days > 0) remText = `${days} күн ${hours} сағат қалды`;
    else remText = `${hours} сағат қалды`;

    return { text: formattedDate, status: 'active', label: remText };
  };

  const deadlineInfo = formatDeadline(material.deadline);
  const isImage = material.fileType?.startsWith('image/') || 
                  material.fileUrl?.endsWith('.svg') || 
                  material.fileUrl?.endsWith('.png') || 
                  material.fileUrl?.endsWith('.jpg') || 
                  material.fileUrl?.endsWith('.webp');

  const isPdf = material.fileType === 'application/pdf' || material.fileUrl?.endsWith('.pdf');

  return (
    <div className="modal-overlay material-lightbox-overlay" onClick={onClose}>
      <div 
        ref={containerRef}
        className={`material-lightbox-container ${isFullscreen ? 'is-fullscreen' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Floating Control Bar */}
        <header className="lightbox-header">
          <div className="lightbox-title-area">
            <span className={`material-cat-pill ${material.category}`}>
              {material.category === 'archive' ? (
                <>
                  <FolderArchive size={13} />
                  <span>Тұрақты Архив</span>
                </>
              ) : (
                <>
                  <Clock size={13} />
                  <span>Үй тапсырмасы</span>
                </>
              )}
            </span>
            <h2 className="lightbox-file-title" title={material.title}>{material.title}</h2>
          </div>

          {/* Interactive Zoom & View Controls */}
          <div className="lightbox-toolbar">
            <button 
              className="toolbar-btn" 
              onClick={handleZoomOut} 
              title="Кішірейту (Zoom Out)"
              disabled={zoom <= 0.5}
            >
              <ZoomOut size={16} />
            </button>
            <span className="zoom-percentage-badge">{Math.round(zoom * 100)}%</span>
            <button 
              className="toolbar-btn" 
              onClick={handleZoomIn} 
              title="Үлкейту (Zoom In)"
              disabled={zoom >= 3.5}
            >
              <ZoomIn size={16} />
            </button>
            <button className="toolbar-btn text-xs px-2" onClick={handleResetZoom} title="100% бастапқы масштаб">
              100%
            </button>
            <button className="toolbar-btn" onClick={handleRotate} title="90° Бұру">
              <RotateCw size={16} />
            </button>
            <button className="toolbar-btn" onClick={toggleFullscreen} title="Толық экран режимі">
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <a 
              href={material.fileUrl} 
              download={material.fileName || 'material.png'} 
              className="toolbar-btn download-btn"
              title="Файлды жүктеп алу (Download)"
            >
              <Download size={16} />
            </a>
            <button 
              className={`toolbar-btn info-toggle ${sidebarOpen ? 'active' : ''}`} 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Тапсырма шартын көрсету/жасыру"
            >
              <Info size={16} />
            </button>
            <button className="toolbar-btn close-btn" onClick={onClose} title="Жабу (Esc)">
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Lightbox Body (Viewer Canvas + Sidebar) */}
        <div className="lightbox-body">
          {/* Main Visual Document Canvas */}
          <div className="lightbox-canvas">
            <div 
              className="lightbox-pan-viewport"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {isImage ? (
                <img 
                  src={material.fileUrl} 
                  alt={material.title} 
                  className="lightbox-rendered-image" 
                />
              ) : isPdf ? (
                <div className="pdf-embed-wrapper">
                  <object 
                    data={material.fileUrl} 
                    type="application/pdf" 
                    className="pdf-embed-frame"
                  >
                    <div className="pdf-fallback-box">
                      <FileText size={48} className="text-emerald-400 mb-3" />
                      <p>Бұл PDF құжатты браузерде көрсету мүмкін болмады.</p>
                      <a href={material.fileUrl} target="_blank" rel="noreferrer" className="btn btn-primary mt-3">
                        PDF-ті жаңа терезеде ашу
                      </a>
                    </div>
                  </object>
                </div>
              ) : (
                <div className="generic-file-view">
                  <FileText size={64} className="text-emerald-400 mb-4" />
                  <h3>{material.fileName}</h3>
                  <p>{material.fileSize || 'Құжат'}</p>
                  <a href={material.fileUrl} download className="btn btn-primary mt-4">
                    <Download size={16} />
                    <span>Файлды Жүктеп Алу</span>
                  </a>
                </div>
              )}
            </div>

            {/* Quick Zoom Helper Pill at Bottom */}
            <div className="floating-canvas-hints">
              <span>{Math.round(zoom * 100)}% • Масштабты өзгерту үшін жоғарғы панельді пайдаланыңыз</span>
            </div>
          </div>

          {/* Right Information & Notebook Solve Sidebar */}
          {sidebarOpen && (
            <aside className="lightbox-sidebar">
              <div className="sidebar-section">
                <span className="sidebar-subtitle">Тақырыбы</span>
                <h3 className="sidebar-title">{material.title}</h3>
                <div className="sidebar-topic-badge">
                  <BookOpen size={13} className="text-emerald-400" />
                  <span>{material.topic || 'Математика'}</span>
                </div>
              </div>

              {/* Instructions / Problem Details */}
              <div className="sidebar-section instructions-card">
                <div className="instruction-header">
                  <BookOpen size={15} className="text-cyan-400" />
                  <span>Мұғалімнің нұсқаулығы:</span>
                </div>
                <p className="instruction-text">
                  {material.description || 'Дәптерге толық шешуін жазып, есептердің сызбаларын сызыңыз.'}
                </p>
                <div className="notebook-offline-tip">
                  <CheckCircle size={14} className="text-emerald-400" />
                  <span>Орындау тәсілі: Дәптерде қолмен шығару (Offline Copybook)</span>
                </div>
              </div>

              {/* Deadline Indicator */}
              {deadlineInfo && (
                <div className={`sidebar-section deadline-card ${deadlineInfo.status}`}>
                  <div className="deadline-header">
                    <Calendar size={15} />
                    <span>Тапсыру мерзімі (Deadline):</span>
                  </div>
                  <div className="deadline-date">{deadlineInfo.text}</div>
                  <div className="deadline-time-remaining">
                    <Clock size={13} />
                    <span>{deadlineInfo.label}</span>
                  </div>
                </div>
              )}

              {/* Archive / Revision Info */}
              {material.category === 'archive' && (
                <div className="sidebar-section archive-notice-card">
                  <FolderArchive size={15} className="text-amber-400" />
                  <div>
                    <strong>Тұрақты Архив Материалы:</strong>
                    <p>Бұл конспект/ереже емтихан алдында қайталау үшін порталда үнемі қолжетімді болып қалады.</p>
                  </div>
                </div>
              )}

              {/* File Technical Metadata */}
              <div className="sidebar-section meta-specs">
                <div className="spec-row">
                  <span className="spec-label">Файл атауы:</span>
                  <span className="spec-val truncate">{material.fileName || 'тапсырма'}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Көлемі:</span>
                  <span className="spec-val">{material.fileSize || '1.2 MB'}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Қаралды:</span>
                  <span className="spec-val flex items-center gap-1">
                    <Eye size={12} /> {material.viewsCount || 1} рет
                  </span>
                </div>
                <div className="spec-row">
                  <span className="spec-label">Орындағандар:</span>
                  <span className="spec-val flex items-center gap-1 text-emerald-400">
                    <Users size={12} /> {solvedCount} оқушы
                  </span>
                </div>
              </div>

              {/* Student Action: "Mark as solved in copybook" */}
              {!isTeacher && activeStudent && (
                <div className="sidebar-section solve-action-box">
                  <button
                    className={`btn btn-block ${isSolved ? 'btn-solved-active' : 'btn-primary'}`}
                    onClick={handleToggleSolved}
                    disabled={isUpdatingSolve}
                  >
                    {isSolved ? (
                      <>
                        <Check size={18} className="text-emerald-300" />
                        <span>Дәптерде орындалды ✓</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        <span>Дәптерде орындадым деп белгілеу</span>
                      </>
                    )}
                  </button>
                  <p className="solve-action-hint">
                    {isSolved
                      ? 'Мұғаліміңіз сіздің тапсырманы дәптерде аяқтағаныңызды көрді.'
                      : 'Есептерді дәптерге шығарып болған соң, осы батырманы басыңыз.'}
                  </p>
                </div>
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

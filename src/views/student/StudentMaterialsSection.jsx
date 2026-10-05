import React, { useState, useEffect } from 'react';
import { 
  FolderArchive, 
  Clock, 
  Calendar, 
  Eye, 
  FileText, 
  CheckCircle, 
  Check, 
  Search, 
  BookOpen, 
  AlertCircle, 
  Download, 
  Sparkles,
  Maximize2,
  BookmarkCheck,
  RefreshCw,
  Flame,
  Award
} from 'lucide-react';
import MaterialViewerModal from '../common/MaterialViewerModal';

export default function StudentMaterialsSection({ 
  activeStudent, 
  classroomCode = 'MATH-2026' 
}) {
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all'); // 'all' | 'homework' | 'archive'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingMaterial, setViewingMaterial] = useState(null);

  useEffect(() => {
    fetchMaterials();
  }, [classroomCode]);

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/materials?classroomCode=${classroomCode}`);
      if (res.ok) {
        const data = await res.json();
        setMaterials(data);
      }
    } catch (err) {
      console.error('Error fetching materials:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSolve = async (materialId, e) => {
    if (e) e.stopPropagation();
    if (!activeStudent?.id) return;

    try {
      const res = await fetch(`/api/materials/${materialId}/toggle-solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: activeStudent.id })
      });
      const data = await res.json();
      if (data.success) {
        setMaterials(prev => prev.map(m => {
          if (m.id !== materialId) return m;
          let solved = m.solvedStudents ? [...m.solvedStudents] : [];
          if (data.isSolved) {
            if (!solved.includes(activeStudent.id)) solved.push(activeStudent.id);
          } else {
            solved = solved.filter(id => id !== activeStudent.id);
          }
          return { ...m, solvedStudents: solved };
        }));
      }
    } catch (err) {
      console.error('Error toggling solve state:', err);
    }
  };

  const handleModalToggleSolve = (materialId, isSolved, solvedCount) => {
    setMaterials(prev => prev.map(m => {
      if (m.id !== materialId) return m;
      let solved = m.solvedStudents ? [...m.solvedStudents] : [];
      if (isSolved) {
        if (!solved.includes(activeStudent?.id)) solved.push(activeStudent?.id);
      } else {
        solved = solved.filter(id => id !== activeStudent?.id);
      }
      return { ...m, solvedStudents: solved };
    }));
  };

  const filteredMaterials = materials.filter(m => {
    const matchesCat = filterCategory === 'all' || m.category === filterCategory;
    const matchesSearch = 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.topic?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const homeworkMaterials = materials.filter(m => m.category === 'homework');
  const archiveMaterials = materials.filter(m => m.category === 'archive');

  const solvedByMeCount = materials.filter(m => 
    activeStudent?.id && m.solvedStudents?.includes(activeStudent.id)
  ).length;

  const formatDeadline = (dl) => {
    if (!dl) return null;
    const date = new Date(dl);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    const formattedDate = date.toLocaleDateString('kk-KZ', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    if (diff < 0) {
      return { text: formattedDate, status: 'expired', label: 'Мерзімі аяқталды' };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    let remText = '';
    if (days > 0) remText = `${days} күн қалды`;
    else remText = `${hours} сағат қалды`;

    return { text: formattedDate, status: 'active', label: remText };
  };

  return (
    <div className="student-materials-section-root">
      {/* Materials Hero Summary Banner */}
      <div className="materials-hero-card">
        <div className="mat-hero-left">
          <div className="mat-hero-badge">
            <BookOpen size={14} className="text-emerald-400" />
            <span>Дәптерде Орындалатын Тапсырмалар & Архив</span>
          </div>
          <h2 className="mat-hero-title">Материалдар & Үй Тапсырмалары</h2>
          <p className="mat-hero-subtitle">
            Мұғалім жүктеген есептер парақтары мен нұсқаларды толық экранда ашып, үлкейтіп (Zoom) қараңыз.
            Есептерді жұмыс дәптеріңізге толық шығарып, орындалғанын белгілеңіз.
          </p>
        </div>

        <div className="mat-hero-stats">
          <div className="mat-stat-pill">
            <div className="stat-val text-cyan-400">{homeworkMaterials.length}</div>
            <div className="stat-lbl">Үй тапсырмасы</div>
          </div>
          <div className="mat-stat-pill">
            <div className="stat-val text-amber-400">{archiveMaterials.length}</div>
            <div className="stat-lbl">Тұрақты Архив</div>
          </div>
          <div className="mat-stat-pill">
            <div className="stat-val text-emerald-400">{solvedByMeCount}</div>
            <div className="stat-lbl">Дәптерде шығарылды</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="materials-filter-bar">
        <div className="filter-tabs-group">
          <button
            className={`filter-btn ${filterCategory === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            <span>Барлық материалдар ({materials.length})</span>
          </button>
          <button
            className={`filter-btn ${filterCategory === 'homework' ? 'active' : ''}`}
            onClick={() => setFilterCategory('homework')}
          >
            <Clock size={14} />
            <span>Үй Тапсырмалары ({homeworkMaterials.length})</span>
          </button>
          <button
            className={`filter-btn ${filterCategory === 'archive' ? 'active' : ''}`}
            onClick={() => setFilterCategory('archive')}
          >
            <FolderArchive size={14} />
            <span>Емтихан Архиві ({archiveMaterials.length})</span>
          </button>
        </div>

        <div className="materials-search-box">
          <Search size={15} className="text-muted" />
          <input
            type="text"
            placeholder="Тапсырма немесе тақырып бойынша іздеу..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Materials */}
      {isLoading ? (
        <div className="materials-loading-state">
          <RefreshCw size={28} className="animate-spin text-emerald-400" />
          <p>Материалдар мен тапсырмалар жүктелуде...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="empty-student-materials">
          <FolderArchive size={52} className="text-muted mb-2" />
          <h3 className="empty-title">Мұғалім әзірге материал жүктеген жоқ</h3>
          <p className="empty-desc">
            Мұғалім жаңа үй тапсырмасын немесе оқу материалдарын жүктеген кезде, олар осы бөлімде автоматты түрде пайда болады.
          </p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="empty-student-materials">
          <Search size={44} className="text-muted mb-2" />
          <h3 className="empty-title">Сәйкес келетін материал табылмады</h3>
          <p className="empty-desc">
            «{searchQuery}» іздеу сұранысы немесе таңдалған санат бойынша материалдар жоқ.
          </p>
          <button 
            className="btn btn-secondary btn-sm mt-3" 
            onClick={() => { setSearchQuery(''); setFilterCategory('all'); }}
          >
            Барлық материалдарды көрсету
          </button>
        </div>
      ) : (
        <div className="student-materials-grid">
          {filteredMaterials.map(mat => {
            const dl = formatDeadline(mat.deadline);
            const isSolved = activeStudent?.id && mat.solvedStudents?.includes(activeStudent.id);
            const isImage = mat.fileType?.startsWith('image/') || 
                            mat.fileUrl?.endsWith('.svg') || 
                            mat.fileUrl?.endsWith('.png') || 
                            mat.fileUrl?.endsWith('.jpg');

            return (
              <div 
                key={mat.id} 
                className={`student-material-card ${isSolved ? 'is-solved' : ''}`}
                onClick={() => setViewingMaterial(mat)}
              >
                {/* Media Preview Box */}
                <div className="mat-card-thumbnail">
                  {isImage ? (
                    <img src={mat.fileUrl} alt={mat.title} className="thumb-img" />
                  ) : (
                    <div className="thumb-doc">
                      <FileText size={44} className="text-cyan-400" />
                      <span className="thumb-ext">{mat.fileName?.split('.').pop()?.toUpperCase() || 'PDF'}</span>
                    </div>
                  )}

                  <div className="thumb-hover-action">
                    <Maximize2 size={20} />
                    <span>Толық экран & Zoom</span>
                  </div>

                  {/* Category Pill */}
                  <span className={`cat-pill-overlay ${mat.category}`}>
                    {mat.category === 'archive' ? 'Тұрақты Архив' : 'Үй тапсырмасы'}
                  </span>

                  {/* Solved Status Indicator Overlay */}
                  {isSolved && (
                    <div className="solved-ribbon">
                      <Check size={13} />
                      <span>Дәптерде орындалды</span>
                    </div>
                  )}
                </div>

                {/* Content Box */}
                <div className="mat-card-body">
                  <div className="mat-topic-pill">
                    <BookOpen size={11} className="text-emerald-400" />
                    <span>{mat.topic}</span>
                  </div>

                  <h3 className="mat-card-title">{mat.title}</h3>

                  <p className="mat-card-desc">
                    {mat.description}
                  </p>

                  {/* Deadline or Permanent Notice */}
                  <div className="mat-deadline-wrapper">
                    {dl ? (
                      <div className={`deadline-strip ${dl.status}`}>
                        <Calendar size={13} />
                        <span>Мерзімі: {dl.text} ({dl.label})</span>
                      </div>
                    ) : mat.category === 'archive' ? (
                      <div className="deadline-strip archive-strip">
                        <FolderArchive size={13} />
                        <span>Емтиханға дейін тұрақты қолжетімді</span>
                      </div>
                    ) : (
                      <div className="deadline-strip neutral-strip">
                        <Clock size={13} />
                        <span>Мерзім шектелмеген</span>
                      </div>
                    )}
                  </div>

                  {/* Offline notebook instruction tip */}
                  <div className="notebook-solve-reminder">
                    <BookmarkCheck size={14} className="text-cyan-400 flex-shrink-0" />
                    <span>Дәптерге шығарып, орындалғанын белгілеңіз</span>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="mat-card-footer" onClick={e => e.stopPropagation()}>
                    <button
                      className={`btn-toggle-solve ${isSolved ? 'solved' : ''}`}
                      onClick={(e) => handleToggleSolve(mat.id, e)}
                    >
                      {isSolved ? (
                        <>
                          <CheckCircle size={15} className="text-emerald-300" />
                          <span>Дәптерде орындалды ✓</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={15} />
                          <span>Дәптерде шығардым</span>
                        </>
                      )}
                    </button>

                    <button
                      className="btn-open-viewer"
                      onClick={() => setViewingMaterial(mat)}
                      title="Толық экранда ашу және Zoom жасау"
                    >
                      <Maximize2 size={15} />
                      <span>Ашу & Zoom</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox / Full-screen Zoom Modal */}
      <MaterialViewerModal
        isOpen={Boolean(viewingMaterial)}
        material={viewingMaterial}
        onClose={() => setViewingMaterial(null)}
        activeStudent={activeStudent}
        onToggleSolve={handleModalToggleSolve}
        isTeacher={false}
      />
    </div>
  );
}

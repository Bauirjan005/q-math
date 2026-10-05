import React, { useState, useEffect } from 'react';
import { 
  FolderArchive, 
  Clock, 
  UploadCloud, 
  Plus, 
  Search, 
  FileText, 
  Image as ImageIcon, 
  Eye, 
  Calendar, 
  Trash2, 
  Archive, 
  RefreshCw, 
  CheckCircle2, 
  Layers, 
  Sparkles,
  ExternalLink,
  Users,
  BookOpen
} from 'lucide-react';
import QuickAssignmentUploadModal from './QuickAssignmentUploadModal';
import MaterialViewerModal from '../common/MaterialViewerModal';

export default function AssignmentsManager({ classroomCode = 'MATH-2026' }) {
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all'); // 'all' | 'homework' | 'archive'
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
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

  const handleToggleArchive = async (materialId) => {
    try {
      const teacherToken = localStorage.getItem('teacher_token') || 'teacher_tok_default';
      const res = await fetch(`/api/materials/${materialId}/archive`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${teacherToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMaterials(prev => prev.map(m => m.id === materialId ? data.material : m));
      }
    } catch (err) {
      console.error('Error toggling archive:', err);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!confirm('Бұл оқу материалын өшіргіңіз келетініне сенімдісіз бе?')) return;
    try {
      const teacherToken = localStorage.getItem('teacher_token') || 'teacher_tok_default';
      const res = await fetch(`/api/materials/${materialId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${teacherToken}` }
      });
      if (res.ok) {
        setMaterials(prev => prev.filter(m => m.id !== materialId));
      }
    } catch (err) {
      console.error('Error deleting material:', err);
    }
  };

  const handleMaterialCreated = (newMaterial) => {
    setMaterials(prev => [newMaterial, ...prev]);
  };

  const filteredMaterials = materials.filter(m => {
    const matchesCat = filterCategory === 'all' || m.category === filterCategory;
    const matchesSearch = 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.topic?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const homeworkCount = materials.filter(m => m.category === 'homework').length;
  const archiveCount = materials.filter(m => m.category === 'archive').length;

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
      return { text: formattedDate, status: 'expired', label: 'Мерзімі өтті' };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    let remText = '';
    if (days > 0) remText = `${days} күн қалды`;
    else remText = `${hours} сағ қалды`;

    return { text: formattedDate, status: 'active', label: remText };
  };

  return (
    <div className="assignments-manager-root">
      {/* Top Controls & Header */}
      <div className="assignments-top-bar">
        <div>
          <h2 className="assignments-main-title">Тапсырмалар & Оқу Материалдары Архиві</h2>
          <p className="assignments-main-subtitle">
            Оқушыларға дәптерге шығару үшін суреттер мен PDF құжаттарды тікелей жүктеп, емтихан алдындағы архив қорын қалыптастырыңыз
          </p>
        </div>

        <button 
          className="btn btn-primary btn-quick-upload"
          onClick={() => setIsUploadOpen(true)}
        >
          <UploadCloud size={18} />
          <span>+ Жедел Тапсырма Жүктеу</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="assignments-filter-strip">
        <div className="cat-filter-pills">
          <button
            className={`filter-pill ${filterCategory === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            <span>Барлығы</span>
            <span className="count-pill">{materials.length}</span>
          </button>

          <button
            className={`filter-pill ${filterCategory === 'homework' ? 'active' : ''}`}
            onClick={() => setFilterCategory('homework')}
          >
            <Clock size={14} />
            <span>Үй тапсырмалары</span>
            <span className="count-pill">{homeworkCount}</span>
          </button>

          <button
            className={`filter-pill ${filterCategory === 'archive' ? 'active' : ''}`}
            onClick={() => setFilterCategory('archive')}
          >
            <FolderArchive size={14} />
            <span>Тұрақты Архив</span>
            <span className="count-pill">{archiveCount}</span>
          </button>
        </div>

        <div className="search-box-wrap">
          <Search size={15} className="text-muted" />
          <input
            type="text"
            placeholder="Тапсырма немесе тақырып бойынша іздеу..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Material Cards Grid */}
      {isLoading ? (
        <div className="materials-loading-state">
          <RefreshCw size={28} className="animate-spin text-emerald-400" />
          <p>Материалдар жүктелуде...</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="empty-materials-card">
          <FolderArchive size={48} className="text-muted" />
          <h3>Әзірге оқу материалдары жүктелмеген</h3>
          <p>
            {filterCategory === 'homework'
              ? 'Үй тапсырмалары табылған жоқ.'
              : filterCategory === 'archive'
              ? 'Тұрақты архивте құжаттар жоқ.'
              : 'Оқушыларға дәптерге шығару үшін алғашқы сурет немесе PDF тапсырмасын жүктеңіз.'}
          </p>
          <button className="btn btn-primary mt-3" onClick={() => setIsUploadOpen(true)}>
            <UploadCloud size={16} />
            <span>Материал Жүктеу</span>
          </button>
        </div>
      ) : (
        <div className="materials-cards-grid">
          {filteredMaterials.map(mat => {
            const dl = formatDeadline(mat.deadline);
            const isImage = mat.fileType?.startsWith('image/') || 
                            mat.fileUrl?.endsWith('.svg') || 
                            mat.fileUrl?.endsWith('.png') || 
                            mat.fileUrl?.endsWith('.jpg');

            return (
              <div key={mat.id} className="assignment-item-card">
                {/* Visual Thumbnail Bar */}
                <div 
                  className="card-media-preview"
                  onClick={() => setViewingMaterial(mat)}
                >
                  {isImage ? (
                    <img src={mat.fileUrl} alt={mat.title} className="thumb-image" />
                  ) : (
                    <div className="thumb-doc-fallback">
                      <FileText size={42} className="text-cyan-400" />
                      <span className="file-ext-tag">{mat.fileName?.split('.').pop()?.toUpperCase() || 'PDF'}</span>
                    </div>
                  )}

                  <div className="thumb-overlay-hover">
                    <Eye size={20} />
                    <span>Толық экранда қарау & Zoom</span>
                  </div>

                  <span className={`cat-badge ${mat.category}`}>
                    {mat.category === 'archive' ? 'Архив (Емтиханға)' : 'Үй тапсырмасы'}
                  </span>
                </div>

                {/* Card Main Info */}
                <div className="card-info-content">
                  <div className="card-topic-tag">
                    <BookOpen size={12} className="text-emerald-400" />
                    <span>{mat.topic}</span>
                  </div>

                  <h3 className="card-item-title" title={mat.title}>
                    {mat.title}
                  </h3>

                  <p className="card-item-desc" title={mat.description}>
                    {mat.description}
                  </p>

                  {/* Deadline or Archive Status */}
                  <div className="card-deadline-row">
                    {dl ? (
                      <div className={`deadline-badge-pill ${dl.status}`}>
                        <Calendar size={13} />
                        <span>Мерзімі: {dl.text} ({dl.label})</span>
                      </div>
                    ) : mat.category === 'archive' ? (
                      <div className="deadline-badge-pill archive">
                        <FolderArchive size={13} />
                        <span>Тұрақты қолжетімді архив</span>
                      </div>
                    ) : (
                      <div className="deadline-badge-pill neutral">
                        <Clock size={13} />
                        <span>Мерзім шектелмеген</span>
                      </div>
                    )}
                  </div>

                  {/* Activity Stats (Views & Notebook Solves) */}
                  <div className="card-stats-strip">
                    <div className="stat-unit" title="Оқушылардың қаралым саны">
                      <Eye size={13} />
                      <span>{mat.viewsCount || 0} қаралды</span>
                    </div>
                    <div className="stat-unit text-emerald-400" title="Дәптерде шығарған оқушылар саны">
                      <CheckCircle2 size={13} />
                      <span>{mat.solvedStudents?.length || 0} дәптерде орындалды</span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="card-actions-strip">
                    <button
                      className="btn-mat-action btn-view"
                      onClick={() => setViewingMaterial(mat)}
                      title="Суретті/құжатты толық экранда үлкейтіп қарау"
                    >
                      <Eye size={14} />
                      <span>Толық қарау & Zoom</span>
                    </button>

                    <button
                      className="btn-mat-action btn-archive-toggle"
                      onClick={() => handleToggleArchive(mat.id)}
                      title={mat.category === 'archive' ? 'Үй тапсырмаларына қайтару' : 'Тұрақты архивке көшіру'}
                    >
                      <Archive size={14} />
                      <span>{mat.category === 'archive' ? 'Архивтен шығару' : 'Архивке'}</span>
                    </button>

                    <button
                      className="btn-mat-action btn-delete-mat"
                      onClick={() => handleDeleteMaterial(mat.id)}
                      title="Өшіру"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Upload Modal */}
      <QuickAssignmentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onMaterialCreated={handleMaterialCreated}
        classroomCode={classroomCode}
      />

      {/* Full-Screen Material Viewer Lightbox */}
      <MaterialViewerModal
        isOpen={Boolean(viewingMaterial)}
        material={viewingMaterial}
        onClose={() => setViewingMaterial(null)}
        isTeacher={true}
      />
    </div>
  );
}

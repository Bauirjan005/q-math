import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Calendar, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  BookOpen,
  FolderArchive,
  Layers
} from 'lucide-react';

export default function QuickAssignmentUploadModal({ 
  isOpen, 
  onClose, 
  onMaterialCreated,
  classroomCode = 'MATH-2026'
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('Алгебра және анализ бастамалары');
  const [category, setCategory] = useState('homework'); // 'homework' | 'archive'
  const [deadline, setDeadline] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrorMsg('');
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Тапсырманың тақырыбын жазыңыз');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('topic', topic);
      formData.append('category', category);
      formData.append('classroomCode', classroomCode);
      if (deadline) formData.append('deadline', deadline);
      if (selectedFile) formData.append('file', selectedFile);

      const teacherToken = localStorage.getItem('teacher_token') || 'teacher_tok_default';
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${teacherToken}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Жүктеу кезінде қате орын алды');
      }

      setIsSubmitting(false);
      onMaterialCreated(data.material);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card quick-upload-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="upload-icon-badge">
              <UploadCloud size={24} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="modal-title">Жедел Тапсырма / Материал Жүктеу</h2>
              <p className="modal-subtitle">
                AI парсингсіз, суреттер мен PDF құжаттарын оқушыларға дәптерге орындау үшін тікелей жариялау
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMsg && (
              <div className="alert-error">
                <AlertCircle size={16} className="inline mr-2 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Title */}
            <div className="form-group">
              <label className="param-label">
                <FileText size={14} className="inline mr-1 text-emerald-400" />
                Тапсырманың тақырыбы *
              </label>
              <input
                type="text"
                className="input-textarea input-single-line"
                placeholder="Мысалы: 5-нұсқа, 12-13 беттер, дәптерге шығару"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Description / Instructions */}
            <div className="form-group">
              <label className="param-label">
                <BookOpen size={14} className="inline mr-1 text-cyan-400" />
                Оқушыға нұсқаулық (Дәптерге шығару шарттары)
              </label>
              <textarea
                className="input-textarea"
                rows={3}
                placeholder="Мысалы: 1-ден 15-ке дейінгі есептерді толық шығару. Сызбаларын сызғышпен сызып, әр қадамның дәлелдемесін жазу."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="parameters-grid">
              {/* Category */}
              <div className="form-group">
                <label className="param-label">Материал түрі (Category)</label>
                <div className="category-toggle-group">
                  <button
                    type="button"
                    className={`cat-toggle-btn ${category === 'homework' ? 'active' : ''}`}
                    onClick={() => setCategory('homework')}
                  >
                    <Clock size={14} />
                    <span>Үй тапсырмасы</span>
                  </button>
                  <button
                    type="button"
                    className={`cat-toggle-btn ${category === 'archive' ? 'active' : ''}`}
                    onClick={() => setCategory('archive')}
                  >
                    <FolderArchive size={14} />
                    <span>Тұрақты Архив</span>
                  </button>
                </div>
              </div>

              {/* Topic */}
              <div className="form-group">
                <label className="param-label">Тақырып (Topic)</label>
                <select
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="param-select"
                >
                  <option value="Алгебра және анализ бастамалары">Алгебра және анализ бастамалары</option>
                  <option value="Туынды және Интеграл">Туынды және Интеграл</option>
                  <option value="Тригонометрия">Тригонометрия</option>
                  <option value="Стереометрия (Геометрия)">Стереометрия (Геометрия)</option>
                  <option value="Планиметрия">Планиметрия</option>
                  <option value="Математикалық сауаттылық">Математикалық сауаттылық</option>
                  <option value="Комбинаторика & Ықтималдық">Комбинаторика & Ықтималдық</option>
                </select>
              </div>
            </div>

            {/* Optional Deadline */}
            <div className="form-group">
              <label className="param-label">
                <Calendar size={14} className="inline mr-1 text-amber-400" />
                Орындау мерзімі (Deadline, міндетті емес)
              </label>
              <input
                type="datetime-local"
                className="input-textarea input-single-line"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
              <span className="text-xs text-muted mt-1 block">
                Мерзім көрсетілсе, оқушыларға қалған уақыт кері санақпен көрініп тұрады.
              </span>
            </div>

            {/* File Dropzone */}
            <div className="form-group">
              <label className="param-label">
                <ImageIcon size={14} className="inline mr-1 text-emerald-400" />
                Құжат немесе сурет файлын таңдаңыз (JPG, PNG, PDF)
              </label>
              
              <div className="dropzone-area quick-dropzone">
                <input
                  type="file"
                  id="quick-file-input"
                  accept="image/png, image/jpeg, image/webp, application/pdf"
                  onChange={handleFileChange}
                  className="hidden-file-input"
                />
                <label htmlFor="quick-file-input" className="dropzone-label">
                  {selectedFile ? (
                    <div className="selected-file-preview">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="img-thumbnail-preview" />
                      ) : (
                        <FileText size={40} className="text-emerald-400 mb-2" />
                      )}
                      <div className="file-info-text">
                        <strong>{selectedFile.name}</strong>
                        <span>({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                      </div>
                      <span className="change-file-btn">Файлды ауыстыру</span>
                    </div>
                  ) : (
                    <div className="empty-dropzone-content">
                      <UploadCloud size={40} className="dropzone-icon" />
                      <div className="dropzone-main-text">
                        Суретті (JPG/PNG) немесе PDF құжатты <span>осында сүйреңіз</span> немесе таңдаңыз
                      </div>
                      <div className="dropzone-sub-text">
                        Есептер парағы, оқулық фотосы немесе дайын нұсқалар (25MB дейін)
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="registration-notice-card">
              <Sparkles size={16} className="text-emerald-400 flex-shrink-0" />
              <span>
                Бұл файл өңделместен, оқушылар порталының «Тапсырмалар / Архив» бөлімінде дәптерге шығару үшін бірден жарияланады.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Бас тарту
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              <UploadCloud size={16} />
              <span>{isSubmitting ? 'Жариялануда...' : 'Оқушыларға Жариялау'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

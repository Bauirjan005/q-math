import React, { useState } from 'react';
import { 
  Sparkles, 
  Plus, 
  BarChart3, 
  FileText, 
  Clock, 
  CheckCircle, 
  Layers, 
  Send, 
  Trash2, 
  Edit3, 
  TrendingUp,
  Users,
  Search,
  BookOpen,
  FolderArchive,
  UploadCloud
} from 'lucide-react';
import MaterialUploadModal from './MaterialUploadModal';
import TestEditor from './TestEditor';
import LiveAnalytics from './LiveAnalytics';
import StudentsRoster from './StudentsRoster';
import AssignmentsManager from './AssignmentsManager';
import QuickAssignmentUploadModal from './QuickAssignmentUploadModal';

export default function TeacherDashboard({ 
  tests = [], 
  students = [],
  onRefreshTests, 
  onPublishTest, 
  onUpdateTest, 
  onDeleteTest 
}) {
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'materials' | 'students' | 'analytics'
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isQuickUploadOpen, setIsQuickUploadOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [selectedAnalyticsTestId, setSelectedAnalyticsTestId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleTestGenerated = (newTest) => {
    onRefreshTests();
    // Open editor right away so teacher can review/edit/approve questions
    setEditingTest(newTest);
  };

  const handleOpenAnalytics = (testId) => {
    setSelectedAnalyticsTestId(testId);
    setActiveTab('analytics');
  };

  const filteredTests = tests.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.topicName && t.topicName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // If currently editing a test, render the TestEditor
  if (editingTest) {
    return (
      <TestEditor
        test={editingTest}
        onUpdateTest={(updated) => {
          onUpdateTest(updated);
          setEditingTest(updated);
        }}
        onPublishTest={async (id) => {
          await onPublishTest(id);
          onRefreshTests();
        }}
        onBack={() => {
          setEditingTest(null);
          onRefreshTests();
        }}
      />
    );
  }

  return (
    <div className="teacher-dashboard-layout">
      {/* Top Welcome / Hero Banner */}
      <div className="teacher-hero-banner">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} className="text-emerald-400" />
            <span>AI Педагогикалық Модуль</span>
          </div>
          <h1 className="hero-title">Математика Пәні Мұғалімінің Басқару Орталығы</h1>
          <p className="hero-description">
            Оқу материалдарынан (PDF/DOCX/сурет) автоматты түрде ҰБТ стандартына сай LaTeX математикалық тесттерді жасаңыз,
            сұрақтарды өңдеп бекітіңіз және оқушылардың типтік қателіктерінің жылу картасын (heatmap) бақылаңыз.
          </p>
        </div>

        <div className="hero-actions flex gap-3">
          <button 
            className="btn btn-secondary btn-hero-quick-upload"
            onClick={() => {
              setActiveTab('materials');
              setIsQuickUploadOpen(true);
            }}
          >
            <UploadCloud size={17} />
            <span>+ Жедел Тапсырма Жүктеу</span>
          </button>

          <button 
            className="btn btn-primary btn-hero-generate"
            onClick={() => setIsUploadOpen(true)}
          >
            <Sparkles size={18} />
            <span>+ AI Жаңа Тест Құрастыру</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="teacher-nav-tabs">
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'tests' ? 'active' : ''}`}
            onClick={() => setActiveTab('tests')}
          >
            <FileText size={17} />
            <span>Тесттер Репозиторийі ({tests.length})</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
            onClick={() => setActiveTab('materials')}
          >
            <FolderArchive size={17} />
            <span>Тапсырмалар & Архив</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <Users size={17} />
            <span>Тіркелген Оқушылар ({students.length})</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={17} />
            <span>Тікелей Аналитика & Heatmap</span>
          </button>
        </div>

        {activeTab === 'tests' && (
          <div className="tab-search">
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Тест немесе тақырыпты іздеу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      {activeTab === 'tests' ? (
        <div className="tests-repository-view">
          {filteredTests.length === 0 ? (
            <div className="empty-tests-state">
              <BookOpen size={48} className="text-muted" />
              <h3>Тесттер табылмады</h3>
              <p>Оқу материалдарын жүктеп, алғашқы AI ҰБТ тестін құрастырыңыз.</p>
              <button className="btn btn-primary" onClick={() => setIsUploadOpen(true)}>
                <Sparkles size={16} />
                <span>AI Тест Құрастыру</span>
              </button>
            </div>
          ) : (
            <div className="tests-grid">
              {filteredTests.map((test) => {
                const isPublished = test.status === 'published';
                const approvedCount = test.questions ? test.questions.filter(q => q.isApproved).length : 0;
                const totalQ = test.questions ? test.questions.length : 0;

                return (
                  <div key={test.id} className="test-card">
                    <div className="test-card-header">
                      <div className="topic-badge">{test.topicName || 'Математика'}</div>
                      <span className={`status-tag ${isPublished ? 'status-published' : 'status-draft'}`}>
                        {isPublished ? '● ЖАРИЯЛАНҒАН' : '○ ТЕКСЕРУДЕ (DRAFT)'}
                      </span>
                    </div>

                    <h3 className="test-card-title">{test.title}</h3>

                    <div className="test-card-meta">
                      <div className="meta-item">
                        <Layers size={14} />
                        <span>{totalQ} сұрақ ({approvedCount} бекітілген)</span>
                      </div>
                      <div className="meta-item">
                        <Clock size={14} />
                        <span>{test.durationMinutes} минут</span>
                      </div>
                      <div className="meta-item">
                        <Users size={14} />
                        <span>{test.submissionCount || 0} тапсырыс</span>
                      </div>
                      {test.averagePercentage && (
                        <div className="meta-item meta-score">
                          <TrendingUp size={14} />
                          <span>Орташа: {test.averagePercentage}%</span>
                        </div>
                      )}
                    </div>

                    <div className="test-card-footer">
                      <div className="card-actions-left">
                        <button
                          className="btn-card-action btn-edit"
                          onClick={() => setEditingTest(test)}
                          title="Сұрақтарды қарау және өңдеу"
                        >
                          <Edit3 size={15} />
                          <span>Сұрақтарды өңдеу</span>
                        </button>

                        <button
                          className="btn-card-action btn-analytics"
                          onClick={() => handleOpenAnalytics(test.id)}
                          title="Оқушылар нәтижесі мен жылу картасы"
                        >
                          <BarChart3 size={15} />
                          <span>Аналитика</span>
                        </button>
                      </div>

                      <div className="card-actions-right">
                        {!isPublished && (
                          <button
                            className="btn-card-action btn-publish"
                            onClick={() => onPublishTest(test.id)}
                            title="Оқушыларға жариялау"
                          >
                            <Send size={15} />
                            <span>Жариялау</span>
                          </button>
                        )}

                        <button
                          className="btn-card-action btn-delete"
                          onClick={() => {
                            if (confirm('Бұл тестті өшіргіңіз келетініне сенімдісіз бе?')) {
                              onDeleteTest(test.id);
                            }
                          }}
                          title="Тестті өшіру"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'materials' ? (
        <AssignmentsManager classroomCode="MATH-2026" />
      ) : activeTab === 'students' ? (
        <StudentsRoster students={students} teacherClassroomCode="MATH-2026" />
      ) : (
        <LiveAnalytics tests={tests} initialTestId={selectedAnalyticsTestId} />
      )}

      {/* Upload & Generate Modal */}
      <MaterialUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onTestGenerated={handleTestGenerated}
      />

      {/* Quick Assignment Upload Modal */}
      <QuickAssignmentUploadModal
        isOpen={isQuickUploadOpen}
        onClose={() => setIsQuickUploadOpen(false)}
        onMaterialCreated={() => {
          setActiveTab('materials');
        }}
        classroomCode="MATH-2026"
      />
    </div>
  );
}

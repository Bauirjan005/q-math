import React, { useState, useEffect } from 'react';
import {
  Play,
  Clock,
  Layers,
  Award,
  CheckCircle,
  RotateCcw,
  Zap,
  BookOpen,
  Flame,
  TrendingUp,
  FileCheck,
  ChevronRight,
  Brain,
  UserPlus,
  FolderArchive,
  Sparkles,
  ShieldCheck,
  Calendar,
  Users,
  CheckCircle2
} from 'lucide-react';
import StudentMaterialsSection from './StudentMaterialsSection';
import FormulaBank from '../../components/FormulaBank';
import FormulaTrainer from '../../components/FormulaTrainer';
import ProctoringReportModal from '../../components/ProctoringReportModal';

export default function StudentDashboard({
  tests = [],
  activeStudent,
  onStartTest,
  onViewResult,
  onOpenRegisterModal
}) {
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'trainer' | 'materials' | 'formulas' | 'history'
  const [submissions, setSubmissions] = useState([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);
  const [selectedProctoringSub, setSelectedProctoringSub] = useState(null);

  const handleSwitchTab = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    fetchStudentSubmissions();
  }, [activeStudent]);

  const fetchStudentSubmissions = async () => {
    setIsLoadingSubs(true);
    try {
      const res = await fetch(`/api/submissions?studentId=${activeStudent.id}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSubs(false);
    }
  };

  const publishedTests = tests.filter(t => t.status === 'published');

  // Compute student stats
  const totalCompleted = submissions.length;
  const avgScore = totalCompleted > 0
    ? Math.round(submissions.reduce((acc, s) => acc + s.percentage, 0) / totalCompleted)
    : 0;

  // Student initials for avatar
  const initials = activeStudent?.name
    ? activeStudent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AH';

  const regDateFormatted = activeStudent?.registeredAt
    ? new Date(activeStudent.registeredAt).toLocaleDateString('kk-KZ', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      })
    : '26.08.2023';

  return (
    <div className="student-dashboard-layout">
      {/* ================= TOP ROW: Profile Card + 3 Metric Cards ================= */}
      <div className="student-top-summary-grid">
        {/* Left Profile Card */}
        <div className="summary-profile-card">
          <div className="summary-avatar-circle">
            {initials}
          </div>
          <div className="summary-profile-details">
            <h2 className="summary-student-name">{activeStudent.name}</h2>
            <div className="summary-meta-row">
              <span className="summary-meta-label">Тіркелген күні:</span>
              <span className="summary-meta-val">{regDateFormatted}</span>
            </div>
            <div className="summary-meta-row">
              <span className="summary-meta-label">Статус:</span>
              <span className="summary-meta-val text-emerald-600 font-medium">ҰБТ-ға дайындық (Белсенді)</span>
            </div>
          </div>
        </div>

        {/* Right 3 Metric Cards */}
        <div className="summary-metrics-row">
          <div className="summary-metric-card">
            <div className="metric-large-number">{totalCompleted}</div>
            <div className="metric-bottom-label">Тапсырылған тест</div>
          </div>

          <div className="summary-metric-card">
            <div className="metric-large-number">{avgScore}%</div>
            <div className="metric-bottom-label">Орташа нәтиже</div>
          </div>

          <div className="summary-metric-card">
            <div className="metric-large-number">7 күн</div>
            <div className="metric-bottom-label">Үздіксіз дайындық</div>
          </div>
        </div>
      </div>

      {/* ================= CATEGORY TABS ================= */}
      <div className="student-subtabs-bar">
        <button
          className={`student-subtab-pill ${activeTab === 'tests' ? 'active' : ''}`}
          onClick={() => handleSwitchTab('tests')}
        >
          ҰБТ Онлайн Тесттері ({publishedTests.length})
        </button>

        <button
          className={`student-subtab-pill ${activeTab === 'trainer' ? 'active' : ''}`}
          onClick={() => handleSwitchTab('trainer')}
        >
          <Flame size={14} className="inline mr-1 text-amber-500" />
          Формула Тренажері
        </button>

        <button
          className={`student-subtab-pill ${activeTab === 'materials' ? 'active' : ''}`}
          onClick={() => handleSwitchTab('materials')}
        >
          Үй Тапсырмасы & Архив
        </button>

        <button
          className={`student-subtab-pill ${activeTab === 'formulas' ? 'active' : ''}`}
          onClick={() => handleSwitchTab('formulas')}
        >
          Формулалар Базасы
        </button>

        <button
          className={`student-subtab-pill ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => handleSwitchTab('history')}
        >
          Тест Тарихы ({submissions.length})
        </button>
      </div>

      {/* ================= TAB 1: TESTS OVERVIEW & FEATURED CARDS ================= */}
      {activeTab === 'tests' && (
        <div className="student-tab-content-container">
          {/* Main 3 Action Cards Grid */}
          <div className="student-action-cards-grid">
            {/* Card 1: Adaptive AI Drill */}
            <div className="student-feature-card">
              <div className="feature-card-header">
                <h3 className="feature-card-title">Адаптивті AI Экспресс-Жаттығу</h3>
              </div>
              <p className="feature-card-desc">
                Адаптивті AI Экспресс-жаттығу өткен тесттердегі әлсіз сұрақтар бойынша жеке сынақ дайындайды.
              </p>
              <button
                className="btn-feature-action"
                onClick={() => {
                  if (publishedTests.length > 0) {
                    onStartTest(publishedTests[0]);
                  } else {
                    alert('Әзірге тест жарияланбаған');
                  }
                }}
              >
                Адаптивті Тест Бастау
              </button>
            </div>

            {/* Card 2: Formula Trainer */}
            <div className="student-feature-card">
              <div className="feature-card-header flex items-center justify-between">
                <h3 className="feature-card-title flex items-center gap-1.5">
                  <span>✏️ Формула Тренажері</span>
                  <Flame size={18} className="text-amber-500 shrink-0" />
                </h3>
              </div>
              <p className="feature-card-desc">
                Формула тренажері жадыңызды нығайтып, ҰБТ формулаларын жылдам жаттауға арналған.
              </p>
              <button
                className="btn-feature-action"
                onClick={() => setActiveTab('trainer')}
              >
                Тестті Бастау
              </button>
            </div>

            {/* Card 3: Assigned Tests Preview */}
            <div className="student-feature-card">
              <div className="feature-card-header flex items-center justify-between">
                <h3 className="feature-card-title flex items-center gap-1.5">
                  <BookOpen size={16} className="text-slate-700" />
                  <span>Тағайындалған ҰБТ Тесттері</span>
                </h3>
                <Users size={16} className="text-slate-500" />
              </div>
              <div className="feature-card-schedule">
                <div className="schedule-date-line">
                  <Calendar size={13} className="inline mr-1 text-slate-500" />
                  <span>14 мамыр 2026</span>
                </div>
                <div className="schedule-meta-text">
                  <span>Математикалық сауаттылық</span>
                </div>
              </div>
              <button
                className="btn-feature-action"
                onClick={() => {
                  if (publishedTests.length > 0) {
                    onStartTest(publishedTests[0]);
                  }
                }}
              >
                Тіркелу / Бастау
              </button>
            </div>
          </div>

          {/* Bottom Card: Official UNT Tests List / Table */}
          <div className="student-tests-table-card">
            <div className="table-card-top-header">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-slate-800" />
                <h3 className="table-card-title">Тағайындалған ҰБТ Тесттері</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="tests-count-pill">{publishedTests.length} қолжетімді</span>
                <Users size={17} className="text-slate-600" />
              </div>
            </div>

            {publishedTests.length === 0 ? (
              <div className="empty-tests-state">
                <BookOpen size={40} className="text-slate-400 mx-auto mb-2" />
                <h4>Әзірге мұғалім жариялаған тесттер жоқ</h4>
                <p>Жаңа тест жарияланған кезде осы тізімде автоматты түрде пайда болады.</p>
              </div>
            ) : (
              <div className="tests-rows-list">
                {publishedTests.map(test => {
                  const existingSub = submissions.find(s => s.testId === test.id);
                  const isSubmitted = Boolean(existingSub);

                  return (
                    <div key={test.id} className="test-item-row">
                      <div className="test-item-left">
                        <div className="test-item-icon-box">
                          <BookOpen size={20} className="text-slate-800" />
                        </div>
                        <div className="test-item-info">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="test-topic-chip">{test.topicName || 'Математика'}</span>
                            <span className="test-diff-chip">{test.difficultyLabel || 'Стандартты'}</span>
                            {isSubmitted && (
                              <span className="test-done-chip">
                                <CheckCircle size={12} className="inline mr-1" />
                                Тапсырылды ({existingSub.percentage}%)
                              </span>
                            )}
                          </div>
                          <h4 className="test-item-title">{test.title}</h4>
                          <div className="test-item-meta">
                            <span><Clock size={12} className="inline mr-1" /> {test.durationMinutes || 40} минут</span>
                            <span>•</span>
                            <span>{test.questions?.length || 10} сұрақ</span>
                          </div>
                        </div>
                      </div>

                      <div className="test-item-actions">
                        {isSubmitted ? (
                          <div className="flex items-center gap-2">
                            <button
                              className="btn-table-action btn-table-view"
                              onClick={() => onViewResult(existingSub, test)}
                            >
                              Қателерді көру
                            </button>
                            <button
                              className="btn-table-action btn-table-retake"
                              onClick={() => onStartTest(test)}
                            >
                              Қайта тапсыру
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn-table-action btn-table-start"
                            onClick={() => onStartTest(test)}
                          >
                            Адаптивті Тест Бастау
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: FORMULA TRAINER ================= */}
      {activeTab === 'trainer' && (
        <div className="student-tab-content-container">
          <FormulaTrainer onBackToDashboard={() => setActiveTab('tests')} />
        </div>
      )}

      {/* ================= TAB 3: MATERIALS & HOMEWORK ================= */}
      {activeTab === 'materials' && (
        <div className="student-tab-content-container">
          <StudentMaterialsSection activeStudent={activeStudent} />
        </div>
      )}

      {/* ================= TAB 4: FORMULA BANK ================= */}
      {activeTab === 'formulas' && (
        <div className="student-tab-content-container">
          <FormulaBank />
        </div>
      )}

      {/* ================= TAB 5: TEST HISTORY ================= */}
      {activeTab === 'history' && (
        <div className="student-tab-content-container">
          <div className="student-tests-table-card">
            <div className="table-card-top-header">
              <h3 className="table-card-title">Тест Тапсыру Тарихы</h3>
              <span className="tests-count-pill">{submissions.length} нәтиже</span>
            </div>

            {submissions.length === 0 ? (
              <div className="empty-tests-state">
                <FileCheck size={40} className="text-slate-400 mx-auto mb-2" />
                <h4>Әзірге тапсырылған тесттер жоқ</h4>
                <p>Тест тапсырып аяқтаған соң толық талдау осы бөлімде сақталады.</p>
              </div>
            ) : (
              <div className="tests-rows-list">
                {submissions.map(sub => {
                  const matchedTest = tests.find(t => t.id === sub.testId);
                  return (
                    <div key={sub.id} className="test-item-row">
                      <div className="test-item-left">
                        <div className="test-item-icon-box">
                          <CheckCircle2 size={20} className="text-emerald-600" />
                        </div>
                        <div className="test-item-info">
                          <h4 className="test-item-title">{sub.testTitle || 'ҰБТ Математика Тесті'}</h4>
                          <div className="test-item-meta">
                            <span>Балл: <strong>{sub.score} / {sub.totalQuestions}</strong> ({sub.percentage}%)</span>
                            <span>•</span>
                            <span>{new Date(sub.submittedAt).toLocaleDateString('kk-KZ')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="test-item-actions">
                        <button
                          className="btn-table-action btn-table-view"
                          onClick={() => matchedTest && onViewResult(sub, matchedTest)}
                        >
                          Талдау мен AI кеңесі
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proctoring Report Modal */}
      {selectedProctoringSub && (
        <ProctoringReportModal
          isOpen={Boolean(selectedProctoringSub)}
          onClose={() => setSelectedProctoringSub(null)}
          submission={selectedProctoringSub.submission}
          testTitle={selectedProctoringSub.testTitle}
        />
      )}

      {/* Mobile Fixed Bottom Navigation Bar (app-like experience) */}
      <nav className="mobile-bottom-nav md:hidden" aria-label="Мобильді навигация">
        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'tests' ? 'active' : ''}`}
          onClick={() => handleSwitchTab('tests')}
        >
          <BookOpen size={20} />
          <span>Тесттер</span>
          {publishedTests.length > 0 && <span className="mobile-nav-dot" />}
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'trainer' ? 'active' : ''}`}
          onClick={() => handleSwitchTab('trainer')}
        >
          <Flame size={20} className={activeTab === 'trainer' ? 'text-amber-500' : ''} />
          <span>Тренажер</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'materials' ? 'active' : ''}`}
          onClick={() => handleSwitchTab('materials')}
        >
          <Layers size={20} />
          <span>Сабақтар</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'formulas' ? 'active' : ''}`}
          onClick={() => handleSwitchTab('formulas')}
        >
          <Brain size={20} />
          <span>Формула</span>
        </button>

        <button
          type="button"
          className={`mobile-nav-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => handleSwitchTab('history')}
        >
          <TrendingUp size={20} />
          <span>Нәтиже</span>
        </button>
      </nav>
    </div>
  );
}

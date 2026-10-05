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
  Sparkles
} from 'lucide-react';
import StudentMaterialsSection from './StudentMaterialsSection';
import FormulaBank from '../../components/FormulaBank';

export default function StudentDashboard({ 
  tests = [], 
  activeStudent, 
  onStartTest, 
  onViewResult,
  onOpenRegisterModal
}) {
  const [activeTab, setActiveTab] = useState('tests'); // 'tests' | 'materials' | 'formulas' | 'history'
  const [submissions, setSubmissions] = useState([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);

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

  return (
    <div className="student-dashboard-layout">
      {/* Student Hero Header */}
      <div className="student-hero-card">
        <div className="student-hero-info">
          <div className="student-avatar-badge">
            <span className="avatar-initials">
              {activeStudent.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <div className="student-greeting">Қош келдіңіз, ҰБТ түлегі!</div>
            <h1 className="student-name">{activeStudent.name}</h1>
            <div className="student-target-tag">
              <Award size={14} className="text-amber-400" />
              <span>Мақсатты балл: 40/40 (Мемлекеттік Грант) • {activeStudent.badge}</span>
            </div>
          </div>
        </div>

        <div className="student-hero-actions-col">
          {/* Quick KPI stats */}
          <div className="student-kpi-row">
            <div className="student-kpi-pill">
              <div className="kpi-num">{totalCompleted}</div>
              <div className="kpi-text">Тапсырылған тест</div>
            </div>

            <div className="student-kpi-pill">
              <div className="kpi-num text-emerald-400">{avgScore}%</div>
              <div className="kpi-text">Орташа нәтиже</div>
            </div>

            <div className="student-kpi-pill">
              <div className="kpi-num text-amber-400">🔥 7 күн</div>
              <div className="kpi-text">Үздіксіз дайындық</div>
            </div>
          </div>

          <button
            className="btn btn-secondary btn-register-hero"
            onClick={onOpenRegisterModal}
            title="Жаңа оқушы ретінде тіркелу"
          >
            <UserPlus size={15} />
            <span>+ Жаңа оқушыны тіркеу (Register)</span>
          </button>
        </div>
      </div>

      {/* Adaptive Drill Promo Banner */}
      <div className="adaptive-drill-banner">
        <div className="drill-icon-box">
          <Brain size={28} className="text-emerald-400" />
        </div>
        <div className="drill-text">
          <h3>Адаптивті AI Экспресс-Жаттығу</h3>
          <p>
            Алгоритм сіздің өткен тесттердегі қателеріңізді талдап, дәл әлсіз тұстарыңыз бойынша жеке тест құрастырады
          </p>
        </div>
        <button
          className="btn btn-primary btn-drill-start"
          onClick={() => {
            if (publishedTests.length > 0) {
              onStartTest(publishedTests[0]);
            } else {
              alert('Әзірге тест жарияланбаған');
            }
          }}
        >
          <Zap size={16} />
          <span>Адаптивті Тест Бастау</span>
        </button>
      </div>

      {/* Student Navigation Sub-Tabs */}
      <div className="teacher-nav-tabs student-nav-tabs mb-6">
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'tests' ? 'active' : ''}`}
            onClick={() => setActiveTab('tests')}
          >
            <BookOpen size={17} />
            <span>ҰБТ Онлайн Тесттері ({publishedTests.length})</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
            onClick={() => setActiveTab('materials')}
          >
            <FolderArchive size={17} />
            <span>Материалдар & Үй Тапсырмалары (Архив)</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'formulas' ? 'active' : ''}`}
            onClick={() => setActiveTab('formulas')}
          >
            <Sparkles size={17} className="text-amber-400" />
            <span>Ресми Формулалар Банкі</span>
          </button>

          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FileCheck size={17} />
            <span>Тест Тарихы & Қателер ({submissions.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'tests' ? (
        /* Published UNT Tests List */
        <div className="student-section">
          <div className="student-section-header">
            <div className="sec-title-wrap">
              <BookOpen size={20} className="text-emerald-400" />
              <h2 className="section-title">Тағайындалған ҰБТ Тесттері</h2>
            </div>
            <span className="tests-count-badge">{publishedTests.length} қолжетімді</span>
          </div>

          {publishedTests.length === 0 ? (
            <div className="empty-student-state">
              <BookOpen size={44} className="text-muted" />
              <h3>Әзірге мұғалім жариялаған тесттер жоқ</h3>
              <p>Жаңа тест жарияланған кезде осы тізімде автоматты түрде пайда болады.</p>
            </div>
          ) : (
            <div className="student-tests-grid">
              {publishedTests.map(test => {
                // Check if student already submitted this test
                const existingSub = submissions.find(s => s.testId === test.id);

                return (
                  <div key={test.id} className="student-test-card">
                    <div className="card-top-row">
                      <span className="topic-pill">{test.topicName}</span>
                      <span className="difficulty-pill">{test.difficultyLabel}</span>
                    </div>

                    <h3 className="card-title">{test.title}</h3>

                    <div className="card-meta-row">
                      <div className="meta-item">
                        <Layers size={15} />
                        <span>{test.questions?.length || 0} сұрақ</span>
                      </div>
                      <div className="meta-item">
                        <Clock size={15} />
                        <span>{test.durationMinutes} минут</span>
                      </div>
                    </div>

                    {existingSub && (
                      <div className="submission-badge-info">
                        <CheckCircle size={15} className="text-emerald-400" />
                        <span>Алдыңғы нәтиже: <strong>{existingSub.totalScore}/{existingSub.maxScore} ({existingSub.percentage}%)</strong></span>
                      </div>
                    )}

                    <div className="card-btn-footer">
                      <button
                        className="btn btn-primary btn-start-exam"
                        onClick={() => onStartTest(test)}
                      >
                        <Play size={16} />
                        <span>{existingSub ? 'Қайта тапсыру (Retake)' : 'Тестті Бастау (Start)'}</span>
                      </button>

                      {existingSub && (
                        <button
                          className="btn btn-secondary btn-review"
                          onClick={() => onViewResult(existingSub, test)}
                          title="Нәтижені және толық шешімдерді көру"
                        >
                          <span>Талдау</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'materials' ? (
        <StudentMaterialsSection 
          activeStudent={activeStudent} 
          classroomCode={activeStudent.classroomCode || 'MATH-2026'} 
        />
      ) : activeTab === 'formulas' ? (
        /* Formula Bank Tab */
        <div className="student-section">
          <FormulaBank embedded={true} />
        </div>
      ) : (
        /* Submission History */
        <div className="student-section">
          <div className="student-section-header">
            <div className="sec-title-wrap">
              <FileCheck size={20} className="text-emerald-400" />
              <h2 className="section-title">Тапсырылған Тесттер Тарихы & Қателерді Талдау</h2>
            </div>
          </div>

          {submissions.length === 0 ? (
            <div className="empty-student-state">
              <FileCheck size={44} className="text-muted" />
              <h3>Әзірге тапсырылған тесттер жоқ</h3>
              <p>Тест тапсырып болғаннан кейін мұнда барлық нәтижелер мен толық талдаулар сақталады.</p>
            </div>
          ) : (
            <div className="history-list">
              {submissions.map(sub => {
                const matchedTest = tests.find(t => t.id === sub.testId);

                return (
                  <div key={sub.id} className="history-item-row">
                    <div className="history-left">
                      <div className="history-score-circle">
                        <span className="hist-pct">{sub.percentage}%</span>
                      </div>
                      <div>
                        <div className="history-title">
                          {matchedTest ? matchedTest.title : 'ҰБТ Математика Тесті'}
                        </div>
                        <div className="history-sub">
                          <span>{sub.totalScore}/{sub.maxScore} ұпай</span> •
                          <span>
                            {new Date(sub.submittedAt).toLocaleDateString('kk-KZ', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="history-right">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => matchedTest && onViewResult(sub, matchedTest)}
                      >
                        <span>Қадамдық шешулер мен AI кеңесі</span>
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

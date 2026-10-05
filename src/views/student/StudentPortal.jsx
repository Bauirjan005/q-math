import React, { useState, useEffect } from 'react';
import StudentNavbar from '../../components/StudentNavbar';
import StudentDashboard from './StudentDashboard';
import TestRunner from './TestRunner';
import TestResultView from './TestResultView';
import StudentAuthModal from './StudentAuthModal';
import { UserCheck, Sparkles, LogIn, UserPlus, Hash } from 'lucide-react';

export default function StudentPortal({
  tests = [],
  onFinishExamSync,
  onOpenFormulaSheet
}) {
  // Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('student_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [authToken, setAuthToken] = useState(() => {
    return localStorage.getItem('student_token') || null;
  });

  const [authModalState, setAuthModalState] = useState({
    isOpen: false,
    mode: 'login' // 'login' | 'register'
  });

  const [activeTakingTest, setActiveTakingTest] = useState(null);
  const [activeResultView, setActiveResultView] = useState(null);

  // Validate session on mount
  useEffect(() => {
    if (authToken && !currentUser) {
      fetch('/api/auth/student/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.student) {
            setCurrentUser(data.student);
            localStorage.setItem('student_user', JSON.stringify(data.student));
          } else {
            handleLogout();
          }
        })
        .catch(() => {});
    }
  }, [authToken]);

  const handleAuthSuccess = (student, token) => {
    setCurrentUser(student);
    setAuthToken(token);
    setAuthModalState({ isOpen: false, mode: 'login' });
    if (onFinishExamSync) onFinishExamSync();
  };

  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/student/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` }
        });
      } catch {}
    }
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_user');
    setCurrentUser(null);
    setAuthToken(null);
    setActiveTakingTest(null);
    setActiveResultView(null);
  };

  const handleStartExam = (test) => {
    // If not authenticated, prompt student to login or register first
    if (!currentUser) {
      setAuthModalState({ isOpen: true, mode: 'login' });
      return;
    }
    setActiveResultView(null);
    setActiveTakingTest(test);
  };

  const handleFinishExam = (submission, test) => {
    setActiveTakingTest(null);
    setActiveResultView({ submission, test });
    if (onFinishExamSync) onFinishExamSync();
  };

  // Default fallback student representation
  const activeStudentProfile = currentUser || {
    id: 'guest',
    name: 'Қонақ (Тіркелмеген)',
    grade: '11-сынып',
    targetScore: '40/40 (Грант)',
    classroomCode: 'MATH-2026'
  };

  return (
    <div className="portal-container student-portal-root">
      {/* Exclusively Dedicated Distraction-Free Student Navbar */}
      <StudentNavbar
        activeStudent={currentUser}
        isAuthenticated={Boolean(currentUser)}
        onOpenAuthModal={(mode) => setAuthModalState({ isOpen: true, mode })}
        onLogout={handleLogout}
        onOpenFormulaSheet={onOpenFormulaSheet}
      />

      <main className="main-content-area student-main-area">
        {/* Unauthenticated Student Callout Banner if guest */}
        {!currentUser && (
          <div className="student-auth-cta-banner">
            <div className="cta-left">
              <div className="cta-icon-wrap">
                <UserCheck size={24} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="cta-title">Оқушы аккаунтына кіріңіз немесе тіркеліңіз</h3>
                <p className="cta-desc">
                  Тест нәтижелеріңіз жеке сақталып, мұғаліміңіздің сыныбына байланысуы үшін аккаунтқа кіріңіз.
                </p>
              </div>
            </div>

            <div className="cta-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setAuthModalState({ isOpen: true, mode: 'login' })}
              >
                <LogIn size={15} />
                <span>Кіру (Login)</span>
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setAuthModalState({ isOpen: true, mode: 'register' })}
              >
                <UserPlus size={15} />
                <span>Тіркелу (Register)</span>
              </button>
            </div>
          </div>
        )}

        {activeTakingTest ? (
          /* Distraction-Free Live UNT Examination Environment */
          <TestRunner
            test={activeTakingTest}
            activeStudent={activeStudentProfile}
            onFinishTest={handleFinishExam}
            onCancel={() => setActiveTakingTest(null)}
          />
        ) : activeResultView ? (
          /* Comprehensive Instant Automated Grading & Solutions Review */
          <TestResultView
            submission={activeResultView.submission}
            test={activeResultView.test}
            onBackToDashboard={() => setActiveResultView(null)}
            onRetake={() => handleStartExam(activeResultView.test)}
          />
        ) : (
          /* Clean Student Portfolio, Published Test Catalog & Performance History */
          <StudentDashboard
            tests={tests}
            activeStudent={activeStudentProfile}
            onStartTest={handleStartExam}
            onViewResult={(sub, test) => setActiveResultView({ submission: sub, test })}
            onOpenRegisterModal={() => setAuthModalState({ isOpen: true, mode: 'register' })}
          />
        )}
      </main>

      {/* Unified Student Login & Registration Modal */}
      <StudentAuthModal
        isOpen={authModalState.isOpen}
        initialMode={authModalState.mode}
        onClose={() => setAuthModalState({ isOpen: false, mode: 'login' })}
        onAuthSuccess={handleAuthSuccess}
        defaultClassroomCode="MATH-2026"
      />
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import TeacherAuthPage from './views/teacher/TeacherAuthPage';
import TeacherPortal from './views/teacher/TeacherPortal';
import StudentPortal from './views/student/StudentPortal';
import FormulaSheetModal from './components/FormulaSheetModal';

export default function App() {
  // Authentication states
  const [teacherToken, setTeacherToken] = useState(() => {
    return localStorage.getItem('teacher_token') || null;
  });

  const [currentTeacher, setCurrentTeacher] = useState(() => {
    try {
      const stored = localStorage.getItem('teacher_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Route resolver:
  // - /portal-auth, /staff, /teacher-auth: Staff authentication page
  // - /teacher/*: If authenticated -> Teacher portal; If unauthenticated -> Teacher login page
  // - /student, /, and all other routes: Student portal
  const resolveRoute = (path, token) => {
    const p = path.toLowerCase();
    
    // Dedicated teacher login route
    if (p.startsWith('/portal-auth') || p.startsWith('/staff') || p.startsWith('/teacher-auth') || p.startsWith('/teacher/login')) {
      if (token) {
        if (window.location.pathname !== '/teacher') {
          window.history.replaceState(null, '', '/teacher');
        }
        return 'teacher';
      }
      return 'teacher-auth';
    }

    // Teacher Route
    if (p.startsWith('/teacher')) {
      if (!token) {
        return 'teacher-auth';
      }
      return 'teacher';
    }

    // Default for public and students: ALWAYS student portal!
    return 'student';
  };

  const [currentRoute, setCurrentRoute] = useState(() => {
    return resolveRoute(window.location.pathname, localStorage.getItem('teacher_token'));
  });

  const [tests, setTests] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeStudent, setActiveStudent] = useState(null);
  const [_isLoadingTests, setIsLoadingTests] = useState(true);

  // Notifications state (for Teacher monitoring)
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [activeToast, setActiveToast] = useState(null);
  const lastKnownNotifIdRef = useRef(null);

  // Modals state
  const [isFormulaSheetOpen, setIsFormulaSheetOpen] = useState(false);

  // Unified Light Theme permanently enforced (#CFD0FF background)
  useEffect(() => {
    localStorage.removeItem('qmath_theme');
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.setAttribute('data-theme', 'light');
  }, []);

  // Synchronize browser history / URL changes
  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = resolveRoute(window.location.pathname, teacherToken);
      setCurrentRoute(nextRoute);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [teacherToken]);

  // Validate teacher session on mount if token present
  useEffect(() => {
    if (teacherToken && !currentTeacher) {
      fetch('/api/auth/teacher/me', {
        headers: { Authorization: `Bearer ${teacherToken}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.teacher) {
            setCurrentTeacher(data.teacher);
            localStorage.setItem('teacher_user', JSON.stringify(data.teacher));
          } else {
            handleTeacherLogout();
          }
        })
        .catch(() => {});
    }
  }, [teacherToken]);

  const navigateTo = (route) => {
    if (route === 'teacher') {
      if (teacherToken) {
        setCurrentRoute('teacher');
        if (window.location.pathname !== '/teacher') {
          window.history.pushState(null, '', '/teacher');
        }
      } else {
        setCurrentRoute('teacher-auth');
        if (window.location.pathname !== '/teacher') {
          window.history.pushState(null, '', '/teacher');
        }
      }
      return;
    }

    if (route === 'teacher-auth') {
      setCurrentRoute('teacher-auth');
      if (window.location.pathname !== '/teacher') {
        window.history.pushState(null, '', '/teacher');
      }
      return;
    }

    if (route === 'student') {
      setCurrentRoute('student');
      if (window.location.pathname !== '/student' && window.location.pathname !== '/') {
        window.history.pushState(null, '', '/student');
      }
      return;
    }

    setCurrentRoute(route);
  };

  useEffect(() => {
    fetchTests();

    // Only fetch teacher data if authenticated as teacher
    if (teacherToken) {
      fetchStudents(true);
      fetchNotifications(true);
    }

    // Polling for teacher notifications if logged in
    const interval = setInterval(() => {
      if (teacherToken) {
        fetchNotifications(true);
        fetchStudents(true);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [teacherToken]);

  const fetchTests = async () => {
    setIsLoadingTests(true);
    try {
      const headers = {};
      if (teacherToken) {
        headers['Authorization'] = `Bearer ${teacherToken}`;
      }
      const res = await fetch('/api/tests', { headers });
      if (res.ok) {
        const data = await res.json();
        setTests(data);
      }
    } catch (err) {
      console.error('Failed to fetch tests:', err);
    } finally {
      setIsLoadingTests(false);
    }
  };

  const fetchStudents = async (silent = false) => {
    if (!teacherToken) return;
    try {
      const res = await fetch('/api/students', {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
        if (!activeStudent && data.length > 0) {
          setActiveStudent(data[0]);
        }
      }
    } catch (err) {
      if (!silent) console.error('Failed to fetch students:', err);
    }
  };

  const fetchNotifications = async (isPolling = false) => {
    if (!teacherToken) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${teacherToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.notifications || [];
        setNotifications(list);
        setUnreadNotifsCount(data.unreadCount || 0);

        // Alert teacher of new notification
        if (list.length > 0) {
          const newest = list[0];
          if (lastKnownNotifIdRef.current && newest.id !== lastKnownNotifIdRef.current && !newest.read) {
            triggerToast(newest);
          }
          lastKnownNotifIdRef.current = newest.id;
        }
      }
    } catch (err) {
      if (!isPolling) console.error('Failed to fetch notifications:', err);
    }
  };

  const triggerToast = (notif) => {
    setActiveToast(notif);
    setTimeout(() => {
      setActiveToast(prev => prev && prev.id === notif.id ? null : prev);
    }, 6000);
  };

  const handleMarkNotifRead = async (id) => {
    if (!teacherToken) return;
    try {
      await fetch(`/api/notifications/${id}/read`, { 
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherToken}` }
      });
      fetchNotifications(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAllNotifs = async () => {
    if (!teacherToken) return;
    try {
      await fetch('/api/notifications/clear', { 
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherToken}` }
      });
      fetchNotifications(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Student Registered Handler
  const handleStudentRegistered = (newStudent) => {
    setActiveStudent(newStudent);
    if (teacherToken) {
      fetchStudents();
      fetchNotifications();
    }
  };

  const handlePublishTest = async (testId) => {
    if (!teacherToken) return;
    try {
      const res = await fetch(`/api/tests/${testId}/publish`, { 
        method: 'POST',
        headers: { Authorization: `Bearer ${teacherToken}` }
      });
      if (res.ok) {
        fetchTests();
      }
    } catch (err) {
      console.error('Failed to publish test:', err);
    }
  };

  const handleUpdateTest = async (updatedTest) => {
    if (!teacherToken) return;
    try {
      const res = await fetch(`/api/tests/${updatedTest.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`
        },
        body: JSON.stringify(updatedTest)
      });
      if (res.ok) {
        fetchTests();
      }
    } catch (err) {
      console.error('Failed to update test:', err);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!teacherToken) return;
    try {
      const res = await fetch(`/api/tests/${testId}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${teacherToken}` }
      });
      if (res.ok) {
        fetchTests();
      }
    } catch (err) {
      console.error('Failed to delete test:', err);
    }
  };

  // Teacher Auth Handlers
  const handleTeacherLoginSuccess = (teacher, token) => {
    setTeacherToken(token);
    setCurrentTeacher(teacher);
    setCurrentRoute('teacher');
    window.history.pushState(null, '', '/teacher');
    fetchTests();
    fetchStudents();
    fetchNotifications();
  };

  const handleTeacherLogout = async () => {
    if (teacherToken) {
      try {
        await fetch('/api/auth/teacher/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${teacherToken}` }
        });
      } catch {}
    }
    localStorage.removeItem('teacher_token');
    localStorage.removeItem('teacher_user');
    setTeacherToken(null);
    setCurrentTeacher(null);
    setCurrentRoute('student');
    window.history.replaceState(null, '', '/student');
  };

  return (
    <div className="app-root-container">
      {currentRoute === 'teacher-auth' ? (
        /* DEDICATED TEACHER AUTHENTICATION */
        <TeacherAuthPage 
          onLoginSuccess={handleTeacherLoginSuccess} 
          onBackToStudent={() => navigateTo('student')}
          currentTheme={theme}
          onToggleTheme={handleToggleTheme}
        />
      ) : currentRoute === 'teacher' && teacherToken ? (
        /* 1. DEDICATED TEACHER PORTAL (Guarded - Accessible with teacher auth) */
        <TeacherPortal
          tests={tests}
          students={students}
          notifications={notifications}
          unreadNotifsCount={unreadNotifsCount}
          activeToast={activeToast}
          onDismissToast={() => setActiveToast(null)}
          onRefreshTests={fetchTests}
          onRefreshStudents={fetchStudents}
          onPublishTest={handlePublishTest}
          onUpdateTest={handleUpdateTest}
          onDeleteTest={handleDeleteTest}
          onMarkNotifRead={handleMarkNotifRead}
          onClearAllNotifs={handleClearAllNotifs}
          onOpenFormulaSheet={() => setIsFormulaSheetOpen(true)}
          onLogout={handleTeacherLogout}
          onSwitchToStudent={() => navigateTo('student')}
        />
      ) : (
        /* 2. DEDICATED STUDENT PORTAL */
        <StudentPortal
          tests={tests}
          students={students}
          activeStudent={activeStudent || (students[0] || { name: 'Оқушы', grade: '11-сынып' })}
          onStudentChange={setActiveStudent}
          onStudentRegistered={handleStudentRegistered}
          onFinishExamSync={() => {
            fetchTests();
            if (teacherToken) {
              fetchStudents(true);
              fetchNotifications(true);
            }
          }}
          onOpenFormulaSheet={() => setIsFormulaSheetOpen(true)}
          onOpenTeacherPortal={() => navigateTo('teacher')}
          isTeacherAuthenticated={Boolean(teacherToken)}
        />
      )}

      {/* Global UNT Formula Sheet Modal */}
      <FormulaSheetModal
        isOpen={isFormulaSheetOpen}
        onClose={() => setIsFormulaSheetOpen(false)}
      />
    </div>
  );
}

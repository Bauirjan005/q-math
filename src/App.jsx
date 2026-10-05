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

  // Strict route resolver:
  // - /portal-auth or /staff/login: Staff authentication page
  // - /teacher/*: STRICTLY guarded. If no teacher token, redirects immediately to /student!
  // - /student, /, and all other routes: Student portal (100% visual isolation, no teacher links)
  const resolveRoute = (path, token) => {
    const p = path.toLowerCase();
    
    // Dedicated teacher login route
    if (p.startsWith('/portal-auth') || p.startsWith('/staff/login') || p.startsWith('/staff')) {
      if (token) {
        if (window.location.pathname !== '/teacher') {
          window.history.replaceState(null, '', '/teacher');
        }
        return 'teacher';
      }
      return 'teacher-auth';
    }

    // Teacher Protected Route
    if (p.startsWith('/teacher')) {
      if (!token) {
        // Immediate silent bounce to /student to prevent ANY information leakage
        if (window.location.pathname !== '/student') {
          window.history.replaceState(null, '', '/student');
        }
        return 'student';
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
  const [isLoadingTests, setIsLoadingTests] = useState(true);

  // Notifications state (for Teacher monitoring)
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [activeToast, setActiveToast] = useState(null);
  const lastKnownNotifIdRef = useRef(null);

  // Modals state
  const [isFormulaSheetOpen, setIsFormulaSheetOpen] = useState(false);

  // Helper for teacher auth headers
  const getTeacherHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (teacherToken) {
      headers['Authorization'] = `Bearer ${teacherToken}`;
    }
    return headers;
  };

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
    if (route === 'teacher' && !teacherToken) {
      // Cannot navigate to teacher without auth, redirect to student
      setCurrentRoute('student');
      window.history.pushState(null, '', '/student');
      return;
    }

    setCurrentRoute(route);
    const targetUrl = route === 'teacher' 
      ? '/teacher' 
      : route === 'teacher-auth' 
      ? '/portal-auth' 
      : '/student';

    if (window.location.pathname !== targetUrl) {
      window.history.pushState(null, '', targetUrl);
    }
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
    setCurrentRoute('teacher-auth');
    window.history.replaceState(null, '', '/portal-auth');
  };

  return (
    <div className="app-root-container">
      {currentRoute === 'teacher-auth' ? (
        /* DEDICATED PROTECTED STAFF AUTHENTICATION (/portal-auth) */
        <TeacherAuthPage onLoginSuccess={handleTeacherLoginSuccess} />
      ) : currentRoute === 'teacher' && teacherToken ? (
        /* 1. DEDICATED TEACHER PORTAL (Guarded - Accessible only with teacher auth) */
        <TeacherPortal
          tests={tests}
          students={students}
          notifications={notifications}
          unreadNotifsCount={unreadNotifsCount}
          activeToast={activeToast}
          onDismissToast={() => setActiveToast(null)}
          onRefreshTests={fetchTests}
          onPublishTest={handlePublishTest}
          onUpdateTest={handleUpdateTest}
          onDeleteTest={handleDeleteTest}
          onMarkNotifRead={handleMarkNotifRead}
          onClearAllNotifs={handleClearAllNotifs}
          onOpenFormulaSheet={() => setIsFormulaSheetOpen(true)}
          onLogout={handleTeacherLogout}
        />
      ) : (
        /* 2. DEDICATED STUDENT PORTAL (100% Visual Isolation, zero teacher links) */
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

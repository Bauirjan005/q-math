import React from 'react';
import { 
  UserCheck, 
  BookOpen, 
  Users, 
  UserPlus,
  LogIn,
  LogOut,
  Hash,
  Sparkles,
  GraduationCap,
  FileText
} from 'lucide-react';
export default function StudentNavbar({ 
  activeStudent, 
  isAuthenticated = false,
  onOpenAuthModal,
  onLogout,
  onOpenFormulaSheet,
  onOpenTeacherPortal,
  isTeacherAuthenticated = false
}) {
  const initials = activeStudent?.name
    ? activeStudent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AH';

  return (
    <header className="navbar-container student-navbar">
      <div className="navbar-left">
        <div className="brand-logo">
          <div className="logo-circle-teal">
            <span className="logo-q-letter">Q</span>
          </div>
          <div className="brand-text">
            <span className="brand-main-title">Q-Math</span>
          </div>
        </div>
      </div>

      <div className="navbar-right">
        {/* Prominent Teacher Cabinet Link */}
        <button
          className={`btn-navbar-pill ${isTeacherAuthenticated ? 'teacher-active-session' : ''}`}
          onClick={onOpenTeacherPortal}
          title="Мұғалім кабинетіне өту / Кабинет учителя"
          id="btn-goto-teacher-portal"
        >
          <GraduationCap size={15} className="text-emerald-600 shrink-0" />
          <span>{isTeacherAuthenticated ? 'Мұғалім кабинеті' : 'Мұғалім кабинеті'}</span>
        </button>

        {/* UNT Math Formula Sheet */}
        <button 
          className="btn-navbar-pill" 
          onClick={onOpenFormulaSheet}
          title="ҰБТ Формулалар анықтамалығы"
        >
          <BookOpen size={14} className="shrink-0" />
          <span>Формулалар</span>
        </button>

        {isAuthenticated && activeStudent ? (
          <>
            {/* Authenticated Avatar circle */}
            <div className="navbar-student-avatar-wrap" title={activeStudent.name}>
              <div className="navbar-avatar-badge">{initials}</div>
              <span className="navbar-student-display-name">{activeStudent.name}</span>
            </div>

            <button
              className="btn-navbar-pill btn-logout-pill"
              onClick={onLogout}
              title="Шығу"
            >
              <LogOut size={14} />
              <span>Шығу</span>
            </button>
          </>
        ) : (
          <>
            <button
              className="btn-navbar-pill"
              onClick={() => onOpenAuthModal('login')}
              title="Оқушы кабинетіне кіру"
              id="btn-student-login"
            >
              <LogIn size={14} />
              <span>Кіру</span>
            </button>

            <button
              className="btn-navbar-pill btn-reg-accent-pill"
              onClick={() => onOpenAuthModal('register')}
              title="Жаңа оқушыны тіркеу"
              id="btn-student-register"
            >
              <UserPlus size={14} />
              <span>Тіркелу</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}

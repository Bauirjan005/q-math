import React from 'react';
import { 
  UserCheck, 
  BookOpen, 
  Users, 
  UserPlus,
  LogIn,
  LogOut,
  ArrowLeftRight,
  Hash,
  Sparkles
} from 'lucide-react';

export default function StudentNavbar({ 
  activeStudent, 
  isAuthenticated = false,
  onOpenAuthModal,
  onLogout,
  onOpenFormulaSheet
}) {
  return (
    <header className="navbar-container student-navbar">
      <div className="navbar-left">
        <div className="brand-logo">
          <div className="logo-icon-wrap student-glow">
            <UserCheck size={22} className="text-white" />
          </div>
          <div className="brand-text">
            <div className="brand-title">
              Q-Math <span className="brand-badge badge-student">Оқушы Порталы</span>
            </div>
            <div className="brand-tagline">ҰБТ Онлайн Емтихан & Формулалар Базасы</div>
          </div>
        </div>
      </div>

      <div className="navbar-right">
        {isAuthenticated && activeStudent ? (
          /* Authenticated Student Identity & Logout */
          <div className="student-auth-user-bar">
            <div className="student-nav-identity">
              <div className="nav-avatar-mini">
                {activeStudent.name ? activeStudent.name.split(' ').map(n => n[0]).join('') : 'О'}
              </div>
              <div className="nav-student-info">
                <span className="nav-student-name">{activeStudent.name}</span>
                <div className="nav-student-tags">
                  <span className="nav-student-grade">{activeStudent.grade || '11-сынып'}</span>
                  {activeStudent.classroomCode && (
                    <span className="nav-student-code" title="Байланыстырылған сынып коды">
                      <Hash size={10} className="inline" />
                      {activeStudent.classroomCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              className="btn-nav-logout"
              onClick={onLogout}
              title="Аккаунттан шығу"
            >
              <LogOut size={15} />
              <span>Шығу</span>
            </button>
          </div>
        ) : (
          /* Unauthenticated Quick Login / Register Actions */
          <div className="student-unauth-actions">
            <button
              className="btn-register-quick"
              onClick={() => onOpenAuthModal('login')}
              title="Оқушы кабинетіне кіру"
              id="btn-student-login"
            >
              <LogIn size={15} />
              <span>Кіру</span>
            </button>

            <button
              className="btn-register-quick btn-reg-accent"
              onClick={() => onOpenAuthModal('register')}
              title="Жаңа оқушыны тіркеу"
              id="btn-student-register"
            >
              <UserPlus size={15} />
              <span>Тіркелу</span>
            </button>
          </div>
        )}

        {/* UNT Math Formula Sheet */}
        <button 
          className="btn-formula-sheet" 
          onClick={onOpenFormulaSheet}
          title="ҰБТ Формулалар анықтамалығы"
        >
          <BookOpen size={15} />
          <span>Формулалар</span>
        </button>
      </div>
    </header>
  );
}

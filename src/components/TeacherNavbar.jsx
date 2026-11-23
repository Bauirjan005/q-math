import React from 'react';
import { 
  GraduationCap, 
  Bell, 
  BookOpen, 
  Sparkles,
  ArrowLeftRight,
  LogOut
} from 'lucide-react';

export default function TeacherNavbar({ 
  unreadNotifsCount = 0,
  onToggleNotifs,
  onOpenFormulaSheet,
  onOpenUploadModal,
  onLogout,
  onSwitchToStudent
}) {
  return (
    <header className="navbar-container teacher-navbar">
      <div className="navbar-left">
        <div className="brand-logo">
          <div className="logo-circle-teal">
            <span className="logo-q-letter">Q</span>
          </div>
          <div className="brand-text">
            <span className="brand-main-title">Q-Math</span>
            <span className="brand-badge-pill">Мұғалім Порталы</span>
          </div>
        </div>
      </div>

      <div className="navbar-right">
        {/* Switch to Student Portal */}
        {onSwitchToStudent && (
          <button 
            className="btn-navbar-pill"
            onClick={onSwitchToStudent}
            title="Оқушы порталына ауысу / Просмотр как ученик"
            id="btn-switch-to-student"
          >
            <ArrowLeftRight size={14} className="shrink-0" />
            <span>Оқушы</span>
          </button>
        )}

        {/* Quick AI Test Generate Button */}
        <button 
          className="btn-navbar-pill btn-reg-accent-pill"
          onClick={onOpenUploadModal}
          title="Жаңа оқу материалдарынан AI тест жасау"
        >
          <Sparkles size={14} className="shrink-0" />
          <span>+ AI Тест</span>
        </button>

        {/* Global UNT Formula Compendium */}
        <button 
          className="btn-navbar-pill" 
          onClick={onOpenFormulaSheet}
          title="ҰБТ Формулалар анықтамалығы"
        >
          <BookOpen size={14} className="shrink-0" />
          <span>Формулалар</span>
        </button>

        {/* Teacher Notification Bell */}
        <div className="relative">
          <button
            className="btn-navbar-pill btn-bell-pill"
            onClick={onToggleNotifs}
            title="Оқушылар хабарламалары"
            id="btn-teacher-notifications"
          >
            <Bell size={16} />
            {unreadNotifsCount > 0 && (
              <span className="notif-badge-pill">{unreadNotifsCount}</span>
            )}
          </button>
        </div>

        {/* Teacher Logout Button */}
        <button 
          className="btn-navbar-pill btn-logout-pill"
          onClick={onLogout}
          title="Мұғалім кабинетінен шығу (Logout)"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Шығу</span>
        </button>
      </div>
    </header>
  );
}

import React from 'react';
import { 
  GraduationCap, 
  Bell, 
  BookOpen, 
  Sparkles,
  ArrowLeftRight,
  LogOut,
  Layers
} from 'lucide-react';

export default function TeacherNavbar({ 
  unreadNotifsCount = 0,
  onToggleNotifs,
  onOpenFormulaSheet,
  onOpenUploadModal,
  onLogout
}) {
  return (
    <header className="navbar-container teacher-navbar">
      <div className="navbar-left">
        <div className="brand-logo">
          <div className="logo-icon-wrap teacher-glow">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div className="brand-text">
            <div className="brand-title">
              Q-Math <span className="brand-badge badge-teacher">Мұғалім Порталы</span>
            </div>
            <div className="brand-tagline">AI Тест Құрастыру & Оқушылар Сараптама Орталығы</div>
          </div>
        </div>
      </div>

      <div className="navbar-right">
        {/* Quick AI Test Generate Button */}
        <button 
          className="btn btn-primary btn-sm btn-quick-generate"
          onClick={onOpenUploadModal}
          title="Жаңа оқу материалдарынан AI тест жасау"
        >
          <Sparkles size={15} />
          <span>+ AI Жаңа Тест</span>
        </button>

        {/* Teacher Notification Bell */}
        <div className="relative">
          <button
            className="btn-icon-notif"
            onClick={onToggleNotifs}
            title="Оқушылар хабарламалары"
            id="btn-teacher-notifications"
          >
            <Bell size={18} />
            {unreadNotifsCount > 0 && (
              <span className="notif-counter-badge">{unreadNotifsCount}</span>
            )}
          </button>
        </div>

        {/* Global UNT Formula Compendium */}
        <button 
          className="btn-formula-sheet" 
          onClick={onOpenFormulaSheet}
          title="ҰБТ Формулалар анықтамалығы"
        >
          <BookOpen size={15} />
          <span>Формулалар</span>
        </button>

        {/* Teacher Logout Button */}
        <button 
          className="btn-switch-portal btn-teacher-logout"
          onClick={onLogout}
          title="Мұғалім кабинетінен шығу (Logout)"
        >
          <LogOut size={15} />
          <span>Шығу</span>
        </button>
      </div>
    </header>
  );
}

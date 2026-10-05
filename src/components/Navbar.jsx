import React from 'react';
import { 
  GraduationCap, 
  UserCheck, 
  BookOpen, 
  Users,
  Bell,
  UserPlus
} from 'lucide-react';

export default function Navbar({ 
  currentRole, 
  onRoleChange, 
  activeStudent, 
  onStudentChange, 
  studentsList = [],
  onOpenFormulaSheet,
  onOpenRegisterModal,
  unreadNotifsCount = 0,
  onToggleNotifs
}) {
  return (
    <header className="navbar-container">
      <div className="navbar-left">
        <div className="brand-logo">
          <div className="logo-icon-wrap">
            <span className="logo-symbol">∑</span>
          </div>
          <div className="brand-text">
            <div className="brand-title">
              Q-Math <span className="brand-badge">ҰБТ / ЕНТ</span>
            </div>
            <div className="brand-tagline">Академиялық математика және AI сараптама платформасы</div>
          </div>
        </div>
      </div>

      <div className="navbar-center">
        {/* THE 2 MAIN TABS: 1. TEACHER, 2. STUDENT */}
        <div className="role-switch-container">
          <button
            className={`role-btn ${currentRole === 'teacher' ? 'active' : ''}`}
            onClick={() => onRoleChange('teacher')}
            id="tab-teacher"
          >
            <GraduationCap size={17} />
            <span>1. Мұғалім бөлімі (Teacher)</span>
            {unreadNotifsCount > 0 && currentRole !== 'teacher' && (
              <span className="tab-unread-dot" title={`${unreadNotifsCount} жаңа хабарлама`} />
            )}
          </button>

          <button
            className={`role-btn ${currentRole === 'student' ? 'active' : ''}`}
            onClick={() => onRoleChange('student')}
            id="tab-student"
          >
            <UserCheck size={17} />
            <span>2. Оқушы бөлімі (Student)</span>
          </button>
        </div>
      </div>

      <div className="navbar-right">
        {currentRole === 'teacher' ? (
          /* Teacher Notification Bell */
          <div className="relative">
            <button
              className="btn-icon-notif"
              onClick={onToggleNotifs}
              title="Хабарламалар"
            >
              <Bell size={18} />
              {unreadNotifsCount > 0 && (
                <span className="notif-counter-badge">{unreadNotifsCount}</span>
              )}
            </button>
          </div>
        ) : (
          /* Student Portal Quick Actions */
          <div className="student-nav-actions">
            <button
              className="btn-register-quick"
              onClick={onOpenRegisterModal}
              title="Жаңа оқушыны тіркеу"
            >
              <UserPlus size={15} />
              <span>Тіркелу (Register)</span>
            </button>

            {studentsList.length > 0 && (
              <div className="student-profile-selector">
                <Users size={14} className="text-muted" />
                <select
                  value={activeStudent?.id || ''}
                  onChange={(e) => {
                    const found = studentsList.find(s => s.id === e.target.value);
                    if (found) onStudentChange(found);
                  }}
                  className="student-select"
                >
                  {studentsList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.grade || '11-сынып'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <button 
          className="btn-formula-sheet" 
          onClick={onOpenFormulaSheet}
          title="ҰБТ Формулалар анықтамалығын ашу"
        >
          <BookOpen size={15} />
          <span>Формулалар</span>
        </button>
      </div>
    </header>
  );
}

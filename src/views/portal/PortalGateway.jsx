import React from 'react';
import { 
  GraduationCap, 
  UserCheck, 
  Sparkles, 
  BookOpen, 
  BarChart3, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Edit3, 
  FileText,
  Users,
  ShieldCheck,
  Zap,
  TrendingUp
} from 'lucide-react';

export default function PortalGateway({ 
  onSelectPortal, 
  testsCount = 0, 
  studentsCount = 0 
}) {
  return (
    <div className="gateway-layout">
      {/* Hero Header */}
      <div className="gateway-hero">
        <div className="gateway-pill">
          <Sparkles size={14} className="text-emerald-400" />
          <span>ҰБТ / ЕНТ Математика Платформасы</span>
        </div>
        
        <h1 className="gateway-title">
          Q-Math <span className="text-gradient">AI Portal</span>
        </h1>
        
        <p className="gateway-subtitle">
          Мұғалімдер мен оқушылар үшін толықтай оқшауланған, кәсіби екі бөлек портал. 
          Қажетті жұмыс кеңістігін таңдаңыз:
        </p>
      </div>

      {/* Two Decoupled Portal Selection Cards */}
      <div className="gateway-cards-grid">
        {/* CARD 1: TEACHER PORTAL */}
        <div className="portal-choice-card card-teacher" onClick={() => onSelectPortal('teacher')}>
          <div className="portal-card-glow-bg glow-emerald" />
          
          <div className="portal-card-top">
            <span className="portal-role-tag tag-teacher">
              <GraduationCap size={14} />
              Педагогтар мен Әдіскерлерге
            </span>
            <span className="route-indicator">/teacher</span>
          </div>

          <div className="portal-card-header">
            <div className="portal-icon-large icon-teacher-large">
              <GraduationCap size={36} />
            </div>
            <div>
              <h2 className="portal-card-title">1. Мұғалім Порталы</h2>
              <p className="portal-card-desc">
                Материал жүктеу, AI тест жасау, KaTeX өңдеу және оқушылар аналитикасы
              </p>
            </div>
          </div>

          <div className="portal-features-list">
            <div className="feature-item">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>PDF, DOCX, суреттерден автоматты ҰБТ тест құрастыру</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>KaTeX математикалық формулаларын өңдеу және бекіту</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Оқушылар қателігінің интерактивті Heatmap жылу картасы</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Оқушылар тіркелгенде нақты уақытта хабарлама алу (Live alerts)</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Тіркелген оқушылар тізімі мен сыныптар мониторингі</span>
            </div>
          </div>

          <div className="portal-card-footer">
            <button className="btn btn-portal-enter btn-teacher-enter">
              <span>Мұғалім Кабинетіне Кіру</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </div>

        {/* CARD 2: STUDENT PORTAL */}
        <div className="portal-choice-card card-student" onClick={() => onSelectPortal('student')}>
          <div className="portal-card-glow-bg glow-cyan" />
          
          <div className="portal-card-top">
            <span className="portal-role-tag tag-student">
              <UserCheck size={14} />
              ҰБТ / ЕНТ Талапкерлеріне
            </span>
            <span className="route-indicator">/student</span>
          </div>

          <div className="portal-card-header">
            <div className="portal-icon-large icon-student-large">
              <UserCheck size={36} />
            </div>
            <div>
              <h2 className="portal-card-title">2. Оқушы Порталы</h2>
              <p className="portal-card-desc">
                Мазасыздықсыз, шынайы ҰБТ емтиханы, сандық сызба тақтасы және талдау
              </p>
            </div>
          </div>

          <div className="portal-features-list">
            <div className="feature-item">
              <CheckCircle2 size={16} className="text-cyan-400" />
              <span>Оңай тіркелу және белсенді тесттерге бірден қатысу</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={16} className="text-cyan-400" />
              <span>ҰБТ кері санақ таймері және сұрақтар навигаторы</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={16} className="text-cyan-400" />
              <span>Интерактивті Neon Glass сандық сызба тақтасы (Scratchpad)</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={16} className="text-cyan-400" />
              <span>Толық қадамдық шешулер мен 20-30 сек ҰБТ Лайфхактары</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={16} className="text-cyan-400" />
              <span>Лезде бағалау, қателерді талдау және грант болжамы</span>
            </div>
          </div>

          <div className="portal-card-footer">
            <button className="btn btn-portal-enter btn-student-enter">
              <span>Оқушы Кабинетіне Кіру</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Live System Stats Bar */}
      <div className="gateway-stats-bar">
        <div className="stat-pill">
          <FileText size={15} className="text-emerald-400" />
          <span><strong>{testsCount}</strong> Дайын Тест</span>
        </div>
        <div className="stat-pill">
          <Users size={15} className="text-cyan-400" />
          <span><strong>{studentsCount}</strong> Тіркелген Оқушы</span>
        </div>
        <div className="stat-pill">
          <Zap size={15} className="text-amber-400" />
          <span>LaTeX / KaTeX Формула Моторы</span>
        </div>
        <div className="stat-pill">
          <ShieldCheck size={15} className="text-indigo-400" />
          <span>ҰБТ 2025/2026 Академиялық Стандарты</span>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserCheck, 
  Award, 
  BookOpen, 
  Calendar, 
  School, 
  Phone, 
  Mail,
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  ExternalLink,
  Copy,
  Check,
  Hash,
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-react';

export default function StudentsRoster({ students = [], teacherClassroomCode = 'MATH-2026' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedCode, setSelectedCode] = useState('all');
  const [isCopied, setIsCopied] = useState(false);

  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      s.name.toLowerCase().includes(q) ||
      (s.school && s.school.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q));

    const matchesGrade = selectedGrade === 'all' || s.grade === selectedGrade;
    const matchesCode = selectedCode === 'all' || (s.classroomCode && s.classroomCode.toUpperCase() === selectedCode.toUpperCase());
    
    return matchesSearch && matchesGrade && matchesCode;
  });

  const totalRegistered = students.length;
  const activeStudentsCount = students.filter(s => s.testsTaken > 0).length;
  const overallAvg = students.filter(s => s.averagePercentage > 0).length > 0
    ? Math.round(
        students.filter(s => s.averagePercentage > 0).reduce((acc, s) => acc + s.averagePercentage, 0) /
        students.filter(s => s.averagePercentage > 0).length
      )
    : 0;

  const gradesList = ['all', ...new Set(students.map(s => s.grade).filter(Boolean))];
  const codesList = ['all', ...new Set(students.map(s => s.classroomCode).filter(Boolean))];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(teacherClassroomCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="students-roster-view">
      {/* Teacher-Student Linking Classroom Code Widget */}
      <div className="classroom-code-banner">
        <div className="banner-left">
          <div className="banner-icon-box">
            <Hash size={24} className="text-amber-400" />
          </div>
          <div>
            <div className="banner-pill">Мұғалім-Оқушы Байланысы</div>
            <h3 className="banner-title">Сыныпқа Шақыру Коды (Classroom Code)</h3>
            <p className="banner-desc">
              Оқушылар тіркелгенде осы кодты енгізсе, олардың аккаунттары автоматты түрде сіздің сыныбыңызға қосылып, барлық тест нәтижелері осы тізімде көрінеді.
            </p>
          </div>
        </div>

        <div className="banner-right">
          <div className="code-display-box" onClick={handleCopyCode} title="Кодты көшіру үшін басыңыз">
            <span className="code-text">{teacherClassroomCode}</span>
            <button className="btn-copy-code" type="button">
              {isCopied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              <span>{isCopied ? 'Көшірілді!' : 'Көшіру'}</span>
            </button>
          </div>
          <span className="linked-count-sub">
            Байланыстырылған оқушылар: <strong>{students.filter(s => s.classroomCode === teacherClassroomCode).length}</strong>
          </span>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="stats-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-blue">
            <Users size={22} />
          </div>
          <div className="kpi-info">
            <div className="kpi-value">{totalRegistered}</div>
            <div className="kpi-label">Тіркелген барлық оқушылар</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-emerald">
            <CheckCircle2 size={22} />
          </div>
          <div className="kpi-info">
            <div className="kpi-value">{activeStudentsCount}</div>
            <div className="kpi-label">Тест тапсырған белсенді оқушылар</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-amber">
            <TrendingUp size={22} />
          </div>
          <div className="kpi-info">
            <div className="kpi-value">{overallAvg}%</div>
            <div className="kpi-label">Сыныптың орташа нәтижесі</div>
          </div>
        </div>
      </div>

      {/* Roster Controls */}
      <div className="roster-controls-bar">
        <div className="search-box">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Оқушы аты, email, телефон немесе мектебін іздеу..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-grade-group">
          <span className="filter-label">Сынып:</span>
          {gradesList.map(g => (
            <button
              key={g}
              className={`filter-btn ${selectedGrade === g ? 'active' : ''}`}
              onClick={() => setSelectedGrade(g)}
            >
              {g === 'all' ? 'Барлығы' : g}
            </button>
          ))}
        </div>
      </div>

      {/* Students Table */}
      <div className="roster-table-card">
        <div className="table-responsive">
          <table className="rankings-table">
            <thead>
              <tr>
                <th>Оқушының аты-жөні</th>
                <th>Байланыс (Email / Тел)</th>
                <th>Сыныбы</th>
                <th>Мектебі / Қаласы</th>
                <th>Сынып коды</th>
                <th>Мақсатты балы</th>
                <th>Тапсырған тесттері</th>
                <th>Орташа нәтиже</th>
                <th>Тіркелген күні</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-muted">
                    Іздеу шарты бойынша оқушылар табылмады
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id}>
                    <td className="student-name-cell">
                      <div className="student-roster-name">
                        <span className="roster-avatar">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </span>
                        <div>
                          <strong>{student.name}</strong>
                          <span className="badge-new-pill">Тіркелген</span>
                        </div>
                      </div>
                    </td>

                    <td className="contact-cell">
                      <div className="flex flex-col text-xs text-muted gap-1">
                        {student.email && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <Mail size={11} className="text-cyan-400" />
                            {student.email}
                          </span>
                        )}
                        {student.phone && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Phone size={11} className="text-emerald-400" />
                            {student.phone}
                          </span>
                        )}
                        {!student.email && !student.phone && <span>—</span>}
                      </div>
                    </td>

                    <td>
                      <span className="grade-badge">{student.grade || '11-сынып'}</span>
                    </td>

                    <td className="school-cell">
                      <School size={13} className="text-muted inline mr-1" />
                      <span>{student.school || 'Жалпы білім беретін мектеп'}</span>
                    </td>

                    <td>
                      <span className="code-pill">
                        <Hash size={11} className="text-amber-400 inline mr-0.5" />
                        {student.classroomCode || teacherClassroomCode}
                      </span>
                    </td>

                    <td>
                      <span className="target-badge">
                        <Award size={12} className="text-amber-400 inline mr-1" />
                        {student.targetScore || '40/40 (Грант)'}
                      </span>
                    </td>

                    <td>
                      <span className="font-bold text-white">{student.testsTaken || 0}</span> тест
                    </td>

                    <td>
                      {student.averagePercentage > 0 ? (
                        <span className={`pct-badge ${student.averagePercentage >= 80 ? 'pct-high' : student.averagePercentage >= 50 ? 'pct-mid' : 'pct-low'}`}>
                          {student.averagePercentage}%
                        </span>
                      ) : (
                        <span className="text-muted text-xs">Әлі тапсырмады</span>
                      )}
                    </td>

                    <td className="date-cell">
                      <Clock size={11} className="inline mr-1 text-muted" />
                      {new Date(student.registeredAt).toLocaleDateString('kk-KZ', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

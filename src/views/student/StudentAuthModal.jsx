import React, { useState } from 'react';
import { 
  UserPlus, 
  LogIn, 
  Sparkles, 
  X, 
  School, 
  Award, 
  Phone, 
  Mail, 
  Lock, 
  User, 
  Hash, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function StudentAuthModal({ 
  isOpen, 
  onClose, 
  onAuthSuccess, 
  initialMode = 'login',
  defaultClassroomCode = 'MATH-2026'
}) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  
  // Login fields
  const [loginContact, setLoginContact] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Registration fields
  const [regName, setRegName] = useState('');
  const [regContact, setRegContact] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGrade, setRegGrade] = useState('11-А');
  const [regSchool, setRegSchool] = useState('');
  const [regTargetScore, setRegTargetScore] = useState('40/40 (Мемлекеттік Грант)');
  const [regClassroomCode, setRegClassroomCode] = useState(defaultClassroomCode);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginContact.trim() || !loginPassword.trim()) {
      setErrorMsg('Email/Телефон және құпия сөзді енгізіңіз');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrPhone: loginContact.trim(),
          password: loginPassword.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Кіру сәтсіз аяқталды');
      }

      // Save token and student session
      localStorage.setItem('student_token', data.token);
      localStorage.setItem('student_user', JSON.stringify(data.student));
      
      setIsLoading(false);
      onAuthSuccess(data.student, data.token);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName.trim()) {
      setErrorMsg('Толық аты-жөніңізді енгізіңіз');
      return;
    }
    if (!regContact.trim()) {
      setErrorMsg('Email немесе телефон нөміріңізді енгізіңіз');
      return;
    }
    if (!regPassword || regPassword.length < 5) {
      setErrorMsg('Құпия сөз кемінде 5 таңбадан тұруы тиіс');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/student/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          emailOrPhone: regContact.trim(),
          password: regPassword.trim(),
          grade: regGrade,
          school: regSchool.trim() || 'Жалпы білім беретін мектеп',
          targetScore: regTargetScore,
          classroomCode: regClassroomCode.trim().toUpperCase() || 'MATH-2026'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Тіркеу кезінде қате орын алды');
      }

      // Save token and student session
      localStorage.setItem('student_token', data.token);
      localStorage.setItem('student_user', JSON.stringify(data.student));

      setIsLoading(false);
      onAuthSuccess(data.student, data.token);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card student-auth-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Top Header with Switchable Tabs */}
        <div className="modal-header auth-modal-header">
          <div className="auth-tab-switch">
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setErrorMsg(''); }}
            >
              <LogIn size={16} />
              <span>Кіру (Login)</span>
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setErrorMsg(''); }}
            >
              <UserPlus size={16} />
              <span>Тіркелу (Register)</span>
            </button>
          </div>

          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="alert-error mx-6 mt-4">
            <AlertCircle size={16} className="inline mr-2 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {mode === 'login' ? (
          /* ================= LOGIN FORM ================= */
          <form onSubmit={handleLoginSubmit}>
            <div className="modal-body">
              <div className="auth-intro-box">
                <h3 className="auth-box-title">Оқушы Кабинетіне Кіру</h3>
                <p className="auth-box-subtitle">
                  Бұрын тіркелген Email немесе телефон нөміріңіз бен құпия сөзіңізді енгізіңіз.
                </p>
              </div>

              <div className="form-group">
                <label className="param-label">
                  <Mail size={14} className="inline mr-1 text-cyan-400" />
                  Email немесе Телефон нөмірі *
                </label>
                <input
                  type="text"
                  className="input-textarea input-single-line"
                  placeholder="aigul@mail.kz немесе +7 (777) 123-4567"
                  value={loginContact}
                  onChange={e => setLoginContact(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="param-label">
                  <Lock size={14} className="inline mr-1 text-cyan-400" />
                  Құпия сөз (Password) *
                </label>
                <input
                  type="password"
                  className="input-textarea input-single-line"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <div className="auth-demo-hint">
                <span>💡 Демо аккаунттар: <strong>aigul@mail.kz</strong> немесе <strong>sanzhar@mail.kz</strong> (Құпия сөз: <strong>password123</strong>)</span>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Жабу
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                <LogIn size={16} />
                <span>{isLoading ? 'Тексерілуде...' : 'Кабинетке Кіру'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* ================= REGISTRATION FORM ================= */
          <form onSubmit={handleRegisterSubmit}>
            <div className="modal-body">
              <div className="auth-intro-box">
                <h3 className="auth-box-title">Жаңа Оқушы Тіркелуі</h3>
                <p className="auth-box-subtitle">
                  Тіркелген соң сіздің нәтижелеріңіз мұғалімге лезде хабарланады және сынып тізіміне қосыласыз.
                </p>
              </div>

              <div className="form-group">
                <label className="param-label">
                  <User size={14} className="inline mr-1 text-emerald-400" />
                  Толық аты-жөніңіз *
                </label>
                <input
                  type="text"
                  className="input-textarea input-single-line"
                  placeholder="Мысалы: Әлихан Төлегенов немесе Аружан Серік"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="parameters-grid">
                <div className="form-group">
                  <label className="param-label">
                    <Mail size={14} className="inline mr-1 text-emerald-400" />
                    Email немесе Телефон *
                  </label>
                  <input
                    type="text"
                    className="input-textarea input-single-line"
                    placeholder="alikhan@mail.kz немесе +7 (707) 111-2233"
                    value={regContact}
                    onChange={e => setRegContact(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="param-label">
                    <Lock size={14} className="inline mr-1 text-emerald-400" />
                    Құпия сөз (Password) *
                  </label>
                  <input
                    type="password"
                    className="input-textarea input-single-line"
                    placeholder="Кемінде 5 таңба"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* TEACHER-STUDENT LINKING VIA CLASSROOM CODE */}
              <div className="classroom-code-group">
                <div className="flex items-center justify-between">
                  <label className="param-label">
                    <Hash size={14} className="inline mr-1 text-amber-400" />
                    Мұғалімнің сынып коды (Classroom Invite Code)
                  </label>
                  <span className="code-hint-badge">Мұғаліммен байланысу</span>
                </div>
                <input
                  type="text"
                  className="input-textarea input-single-line input-code"
                  placeholder="Мысалы: MATH-2026"
                  value={regClassroomCode}
                  onChange={e => setRegClassroomCode(e.target.value.toUpperCase())}
                />
                <p className="code-subtext">
                  Мұғаліміңіз берген сынып кодын енгізсеңіз, тест нәтижелеріңіз автоматты түрде сол мұғалімнің кабинетінде шығады.
                </p>
              </div>

              <div className="parameters-grid">
                <div className="form-group">
                  <label className="param-label">Сыныбы (Grade)</label>
                  <select
                    value={regGrade}
                    onChange={e => setRegGrade(e.target.value)}
                    className="param-select"
                  >
                    <option value="11-А">11-А сынып</option>
                    <option value="11-Б">11-Б сынып</option>
                    <option value="11-В">11-В сынып</option>
                    <option value="11-Г">11-Г сынып</option>
                    <option value="10-сынып">10-сынып (Ерте дайындық)</option>
                    <option value="Түлек / Колледж">Түлек / Колледж</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="param-label">
                    <Award size={14} className="inline mr-1 text-amber-400" />
                    Мақсатты ҰБТ балы
                  </label>
                  <select
                    value={regTargetScore}
                    onChange={e => setRegTargetScore(e.target.value)}
                    className="param-select"
                  >
                    <option value="40/40 (Мемлекеттік Грант)">40/40 (Мемлекеттік Грант)</option>
                    <option value="38/40 (Жоғары балл)">38/40 (Жоғары балл)</option>
                    <option value="35/40 (Жақсы нәтиже)">35/40 (Жақсы нәтиже)</option>
                    <option value="30/40 (Шекті баллдан жоғары)">30/40 (Шекті баллдан жоғары)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="param-label">
                  <School size={14} className="inline mr-1 text-muted" />
                  Мектебі немесе Қаласы
                </label>
                <input
                  type="text"
                  className="input-textarea input-single-line"
                  placeholder="Мысалы: РФММ, №178 лицей, БИЛ немесе Астана қ."
                  value={regSchool}
                  onChange={e => setRegSchool(e.target.value)}
                />
              </div>

              <div className="registration-notice-card">
                <Sparkles size={16} className="text-emerald-400 flex-shrink-0" />
                <span>
                  Тіркелген бойда мұғалім кабинетінде нақты уақытта хабарлама (notification) пайда болады!
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Бас тарту
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                <UserPlus size={16} />
                <span>{isLoading ? 'Тіркелуде...' : 'Тіркелу және Тестке Кіру'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

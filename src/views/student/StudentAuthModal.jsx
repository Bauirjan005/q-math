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
  AlertCircle,
  KeyRound,
  ArrowLeft
} from 'lucide-react';

export default function StudentAuthModal({ 
  isOpen, 
  onClose, 
  onAuthSuccess, 
  initialMode = 'login',
  defaultClassroomCode = 'MATH-2026'
}) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot'
  
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

  // Forgot password fields
  const [forgotContact, setForgotContact] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
    setSuccessMsg('');

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
    setSuccessMsg('');

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

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotContact.trim()) {
      setErrorMsg('Email немесе телефон нөміріңізді енгізіңіз');
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 5) {
      setErrorMsg('Жаңа құпия сөз кемінде 5 таңбадан тұруы тиіс');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMsg('Енгізілген құпия сөздер бір-біріне сәйкес келмейді');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/student/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrPhone: forgotContact.trim(),
          newPassword: forgotNewPassword.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Құпия сөзді жаңарту сәтсіз аяқталды');
      }

      setSuccessMsg(data.message || 'Құпия сөз сәтті жаңартылды!');
      setLoginContact(forgotContact.trim());
      setLoginPassword(forgotNewPassword.trim());
      setTimeout(() => {
        setMode('login');
        setSuccessMsg('');
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card student-auth-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Top Header with Switchable Tabs */}
        <div className="modal-header auth-modal-header">
          {mode === 'forgot' ? (
            <div className="auth-tab-switch">
              <button
                type="button"
                className="auth-tab-btn active"
              >
                <KeyRound size={16} />
                <span>Құпия сөзді жаңарту (Сброс пароля)</span>
              </button>
            </div>
          ) : (
            <div className="auth-tab-switch">
              <button
                type="button"
                className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              >
                <LogIn size={16} />
                <span>Кіру (Login)</span>
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
                onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              >
                <UserPlus size={16} />
                <span>Тіркелу (Register)</span>
              </button>
            </div>
          )}

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

        {successMsg && (
          <div className="alert-success mx-6 mt-4 flex items-center gap-2 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-lg text-sm">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {mode === 'forgot' ? (
          /* ================= FORGOT / RESET PASSWORD FORM ================= */
          <form onSubmit={handleResetPasswordSubmit}>
            <div className="modal-body">
              <div className="auth-intro-box">
                <h3 className="auth-box-title">Құпия Сөзді Қалпына Келтіру</h3>
                <p className="auth-box-subtitle">
                  Тіркелген Email немесе телефон нөміріңізді енгізіп, жаңа құпия сөз орнатыңыз.
                </p>
              </div>

              <div className="form-group">
                <label className="param-label">
                  <Mail size={14} className="inline mr-1 text-cyan-400" />
                  Тіркелген Email немесе Телефон нөмірі *
                </label>
                <input
                  type="text"
                  className="input-textarea input-single-line"
                  placeholder="Мысалы: aigul@mail.kz немесе +7 (777) 123-4567"
                  value={forgotContact}
                  onChange={e => setForgotContact(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="param-label">
                  <Lock size={14} className="inline mr-1 text-cyan-400" />
                  Жаңа құпия сөз (Кемінде 5 таңба) *
                </label>
                <input
                  type="password"
                  className="input-textarea input-single-line"
                  placeholder="Жаңа құпия сөзді енгізіңіз"
                  value={forgotNewPassword}
                  onChange={e => setForgotNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="param-label">
                  <Lock size={14} className="inline mr-1 text-cyan-400" />
                  Жаңа құпия сөзді растаңыз *
                </label>
                <input
                  type="password"
                  className="input-textarea input-single-line"
                  placeholder="Құпия сөзді қайталаңыз"
                  value={forgotConfirmPassword}
                  onChange={e => setForgotConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-footer flex items-center justify-between">
              <button
                type="button"
                className="btn btn-secondary flex items-center gap-1.5"
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              >
                <ArrowLeft size={15} />
                <span>Кіруге оралу</span>
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                <KeyRound size={16} />
                <span>{isLoading ? 'Сақталуда...' : 'Жаңа Құпия Сөзді Сақтау'}</span>
              </button>
            </div>
          </form>
        ) : mode === 'login' ? (
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
                <div className="flex justify-between items-center mb-1">
                  <label className="param-label mb-0">
                    <Lock size={14} className="inline mr-1 text-cyan-400" />
                    Құпия сөз (Password) *
                  </label>
                  <button
                    type="button"
                    className="btn-forgot-password text-xs text-sky-400 hover:text-sky-300 transition-colors"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                      setSuccessMsg('');
                      setForgotContact(loginContact);
                    }}
                  >
                    Құпия сөзді ұмыттыңыз ба? (Забыли пароль?)
                  </button>
                </div>
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
                    placeholder="student@mail.kz немесе +7..."
                    value={regContact}
                    onChange={e => setRegContact(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="param-label">
                    <Lock size={14} className="inline mr-1 text-emerald-400" />
                    Құпия сөз (кемінде 5 таңба) *
                  </label>
                  <input
                    type="password"
                    className="input-textarea input-single-line"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="parameters-grid">
                <div className="form-group">
                  <label className="param-label">
                    <Hash size={14} className="inline mr-1 text-amber-400" />
                    Мұғалім сынып коды *
                  </label>
                  <input
                    type="text"
                    className="input-textarea input-single-line"
                    placeholder="MATH-2026"
                    value={regClassroomCode}
                    onChange={e => setRegClassroomCode(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="param-label">Сыныбыңыз</label>
                  <select
                    className="select-dropdown"
                    value={regGrade}
                    onChange={e => setRegGrade(e.target.value)}
                  >
                    <option value="11-А">11-А</option>
                    <option value="11-Ә">11-Ә</option>
                    <option value="11-Б">11-Б</option>
                    <option value="10-А">10-А</option>
                    <option value="10-Ә">10-Ә</option>
                    <option value="9-А">9-А</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="param-label">
                  <Award size={14} className="inline mr-1 text-amber-400" />
                  Мақсатты ҰБТ Балыңыз
                </label>
                <select
                  className="select-dropdown"
                  value={regTargetScore}
                  onChange={e => setRegTargetScore(e.target.value)}
                >
                  <option value="40/40 (Мемлекеттік Грант)">40/40 (Мемлекеттік Грант)</option>
                  <option value="38/40 (Жоғары балл)">38/40 (Жоғары балл)</option>
                  <option value="35/40 (Жақсы нәтиже)">35/40 (Жақсы нәтиже)</option>
                  <option value="30/40 (Шекті баллдан жоғары)">30/40 (Шекті баллдан жоғары)</option>
                </select>
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

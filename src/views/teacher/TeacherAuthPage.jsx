import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  AlertCircle, 
  GraduationCap, 
  KeyRound 
} from 'lucide-react';

export default function TeacherAuthPage({ 
  onLoginSuccess, 
  onBackToStudent
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [newTeacherPassword, setNewTeacherPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleResetTeacherPassword = async (e) => {
    e.preventDefault();
    if (!email.trim() || !newTeacherPassword.trim()) {
      setErrorMsg('Email және жаңа құпия сөзді енгізіңіз');
      return;
    }
    if (newTeacherPassword.length < 5) {
      setErrorMsg('Құпия сөз кемінде 5 таңбадан тұруы тиіс');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/teacher/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), newPassword: newTeacherPassword.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Құпия сөзді өзгерту қатесі');
      setSuccessMsg(data.message || 'Құпия сөз сәтті жаңартылды!');
      setPassword(newTeacherPassword.trim());
      setTimeout(() => {
        setIsForgotMode(false);
        setSuccessMsg('');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Email және құпия сөзді енгізіңіз');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/teacher/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Кіру сәтсіз аяқталды');
      }

      // Store teacher session
      localStorage.setItem('teacher_token', data.token);
      localStorage.setItem('teacher_user', JSON.stringify(data.teacher));

      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess(data.teacher, data.token);
      }
    } catch (err) {
      console.error('Teacher login error:', err);
      setErrorMsg(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="teacher-auth-page-root">
      <div className="teacher-auth-card">
        {/* Top Header Badge */}
        <div className="auth-brand-badge">
          <div className="auth-icon-wrap">
            <GraduationCap size={28} className="text-emerald-400" />
          </div>
          <div className="brand-text-header">
            <span className="brand-name">Q-Math</span>
            <span className="brand-sub">Мұғалімдер Орталығы • Кабинет Учителя</span>
          </div>
        </div>

        <div className="auth-security-notice">
          <ShieldCheck size={16} className="text-cyan-400 flex-shrink-0" />
          <span>Қорғалған басқару жүйесі. Мұғалімдер мен әдіскерлер үшін (Вход для педагогов).</span>
        </div>

        {errorMsg && (
          <div className="alert-error mt-4">
            <AlertCircle size={16} className="inline mr-2 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert-success mt-4 flex items-center gap-2 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-lg text-sm">
            <Sparkles size={16} className="text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {isForgotMode ? (
          <form onSubmit={handleResetTeacherPassword} className="teacher-auth-form mt-4">
            <div className="form-group">
              <label className="param-label">
                <Mail size={14} className="inline mr-1 text-emerald-400" />
                Мұғалім Email *
              </label>
              <input
                type="text"
                className="input-textarea input-single-line"
                placeholder="teacher@qmath.kz"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="param-label">
                <KeyRound size={14} className="inline mr-1 text-cyan-400" />
                Жаңа құпия сөз (кемінде 5 таңба) *
              </label>
              <input
                type="password"
                className="input-textarea input-single-line"
                placeholder="Жаңа құпия сөзді жазыңыз"
                value={newTeacherPassword}
                onChange={e => setNewTeacherPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-secondary flex-1"
                onClick={() => { setIsForgotMode(false); setErrorMsg(''); setSuccessMsg(''); }}
              >
                ← Кіруге оралу
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={isLoading}
              >
                <span>{isLoading ? 'Сақталуда...' : 'Құпия сөзді сақтау'}</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="teacher-auth-form mt-4">
            <div className="form-group">
              <label className="param-label">
                <Mail size={14} className="inline mr-1 text-emerald-400" />
                Мұғалім Email / Логин *
              </label>
              <input
                type="text"
                className="input-textarea input-single-line"
                placeholder="teacher@qmath.kz"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <div className="flex justify-between items-center mb-1">
                <label className="param-label mb-0">
                  <KeyRound size={14} className="inline mr-1 text-cyan-400" />
                  Құпия сөз (Password) *
                </label>
                <button
                  type="button"
                  className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                  onClick={() => { setIsForgotMode(true); setErrorMsg(''); setSuccessMsg(''); }}
                >
                  Құпия сөзді ұмыттыңыз ба?
                </button>
              </div>
              <input
                type="password"
                className="input-textarea input-single-line"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-teacher-login"
              disabled={isLoading}
            >
              <span>{isLoading ? 'Тексерілуде...' : 'Мұғалім Кабинетіне Кіру (Войти)'}</span>
              <ArrowRight size={17} />
            </button>
          </form>
        )}

        {/* Back to student portal */}
        {onBackToStudent && (
          <button
            type="button"
            className="btn-back-to-student"
            onClick={onBackToStudent}
            id="btn-back-to-student"
          >
            <ArrowLeft size={15} />
            <span>Оқушы порталына оралу (Режим ученика)</span>
          </button>
        )}
      </div>
    </div>
  );
}

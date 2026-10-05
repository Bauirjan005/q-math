import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  GraduationCap,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

export default function TeacherAuthPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleAutofillDemo = () => {
    setEmail('teacher@qmath.kz');
    setPassword('admin2026');
    setErrorMsg('');
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
            <span className="brand-sub">Мұғалімдер мен Әкімшілік Орталығы</span>
          </div>
        </div>

        <div className="auth-security-notice">
          <ShieldCheck size={16} className="text-cyan-400 flex-shrink-0" />
          <span>Қорғалған жабық жүйе. Тек мектеп педагогтары мен әдіскерлер үшін.</span>
        </div>

        {errorMsg && (
          <div className="alert-error mt-4">
            <AlertCircle size={16} className="inline mr-2 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="teacher-auth-form">
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
            <label className="param-label">
              <KeyRound size={14} className="inline mr-1 text-cyan-400" />
              Құпия сөз (Password) *
            </label>
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
            <span>{isLoading ? 'Тексерілуде...' : 'Мұғалім Кабинетіне Кіру'}</span>
            <ArrowRight size={17} />
          </button>
        </form>

        {/* Quick Demo Credentials Pill */}
        <div className="teacher-demo-pill" onClick={handleAutofillDemo}>
          <div className="demo-pill-header">
            <Sparkles size={14} className="text-amber-400" />
            <span>Демо Мұғалім Тіркелгісі (Автотолтыру үшін басыңыз):</span>
          </div>
          <div className="demo-credentials-line">
            <span>Логин: <strong>teacher@qmath.kz</strong></span>
            <span>Құпия сөз: <strong>admin2026</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

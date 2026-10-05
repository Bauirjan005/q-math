import React, { useState } from 'react';
import { UserPlus, Sparkles, X, CheckCircle2, School, Award, Phone, User } from 'lucide-react';

export default function StudentRegisterModal({ isOpen, onClose, onRegistered }) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('11-А');
  const [school, setSchool] = useState('');
  const [targetScore, setTargetScore] = useState('40/40 (Мемлекеттік Грант)');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Аты-жөніңізді енгізіңіз');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/students/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          grade,
          school: school.trim() || 'Жалпы білім беретін мектеп',
          targetScore,
          phone: phone.trim()
        })
      });

      if (!res.ok) {
        throw new Error('Тіркеу кезінде қате орын алды');
      }

      const data = await res.json();
      setIsSubmitting(false);
      onRegistered(data.student);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card register-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="reg-icon-badge">
              <UserPlus size={22} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="modal-title">Оқушыны Тіркеу (Student Registration)</h2>
              <p className="modal-subtitle">
                Тіркелген соң сіздің профиліңіз бен нәтижелеріңіз мұғалімге нақты уақытта көрінеді
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMsg && (
              <div className="alert-error">
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="form-group">
              <label className="param-label">
                <User size={14} className="inline mr-1" />
                Оқушының толық аты-жөні *
              </label>
              <input
                type="text"
                className="input-textarea"
                placeholder="Мысалы: Әлихан Төлегенов немесе Аружан Серік"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="parameters-grid">
              <div className="form-group">
                <label className="param-label">Сыныбы (Grade)</label>
                <select
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  className="param-select"
                >
                  <option value="11-А">11-А сынып</option>
                  <option value="11-Б">11-Б сынып</option>
                  <option value="11-В">11-В сынып</option>
                  <option value="11-Г">11-Г сынып</option>
                  <option value="10-сынып">10-сынып (Ерте дайындық)</option>
                  <option value="Колледж / Түлек">Колледж / Өткен жылғы түлек</option>
                </select>
              </div>

              <div className="form-group">
                <label className="param-label">
                  <Award size={14} className="inline mr-1" />
                  Мақсатты ҰБТ балы
                </label>
                <select
                  value={targetScore}
                  onChange={e => setTargetScore(e.target.value)}
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
                <School size={14} className="inline mr-1" />
                Мектебі немесе Қаласы
              </label>
              <input
                type="text"
                className="input-textarea"
                placeholder="Мысалы: РФММ, №178 лицей, БИЛ немесе Астана қ."
                value={school}
                onChange={e => setSchool(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="param-label">
                <Phone size={14} className="inline mr-1" />
                Байланыс телефоны / WhatsApp (міндетті емес)
              </label>
              <input
                type="text"
                className="input-textarea"
                placeholder="+7 (707) 000-0000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div className="registration-notice-card">
              <Sparkles size={16} className="text-emerald-400" />
              <span>
                Тіркелу батырмасын басқан соң мұғалімнің кабинетінде тікелей хабарлама (notification) пайда болады!
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
              disabled={isSubmitting}
            >
              <UserPlus size={16} />
              <span>{isSubmitting ? 'Тіркелуде...' : 'Тіркелу және Тестке Кіру'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

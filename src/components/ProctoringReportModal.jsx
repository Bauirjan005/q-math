import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  Video, 
  VideoOff, 
  X, 
  User, 
  FileText, 
  ExternalLink,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';

export default function ProctoringReportModal({
  isOpen,
  onClose,
  submission,
  testTitle
}) {
  if (!isOpen || !submission) return null;

  const proctoring = submission.proctoring || {
    warningCount: 0,
    violationsCount: 0,
    violations: [],
    cameraEnabled: true,
    integrityScore: 100,
    autoSubmitted: false
  };

  const violations = proctoring.violations || [];
  const integrityScore = proctoring.integrityScore ?? Math.max(0, 100 - violations.length * 25);
  const isClean = violations.length === 0 && !proctoring.autoSubmitted;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card proctoring-report-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="report-modal-header">
          <div className="report-header-left">
            <div className={`report-shield-icon ${isClean ? 'shield-clean' : 'shield-flagged'}`}>
              {isClean ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
            </div>
            <div>
              <div className="report-pill">
                {isClean ? '✅ Ереже бұзушылықсыз' : '⚠️ Ереже бұзушылық тіркелді'}
              </div>
              <h3 className="report-title">AI Прокторинг & Академиялық Тазалық Есебі</h3>
              <p className="report-subtitle">
                ҰБT онлайн емтиханының қауіпсіздік мониторингі хаттамасы
              </p>
            </div>
          </div>

          <button className="btn-close-modal" onClick={onClose} title="Жабу">
            <X size={18} />
          </button>
        </div>

        {/* Overview Stats Cards */}
        <div className="proctoring-kpi-grid">
          <div className="proctoring-kpi-card">
            <div className="kpi-label">Академиялық сенімділік:</div>
            <div className={`kpi-score-val ${integrityScore >= 90 ? 'text-emerald-400' : integrityScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
              {integrityScore}%
            </div>
            <span className="kpi-hint">
              {integrityScore >= 90 ? 'Мінсіз таза' : integrityScore >= 50 ? 'Күдікті әрекеттер бар' : 'Қатаң ереже бұзылды'}
            </span>
          </div>

          <div className="proctoring-kpi-card">
            <div className="kpi-label">Терезеден шығу ескертулері:</div>
            <div className={`kpi-score-val ${proctoring.warningCount > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
              {proctoring.warningCount} / 3
            </div>
            <span className="kpi-hint">
              {proctoring.autoSubmitted ? '🛑 Авто-тапсыру іске қосылды' : 'Рұқсат шегінде'}
            </span>
          </div>

          <div className="proctoring-kpi-card">
            <div className="kpi-label">Веб-камера бақылауы:</div>
            <div className="kpi-camera-status">
              {proctoring.cameraEnabled ? (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <Video size={16} /> Қосулы болды
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1 font-semibold">
                  <VideoOff size={16} /> Өшірілген / Үзілген
                </span>
              )}
            </div>
            <span className="kpi-hint">Бейне ағыны жазбасы</span>
          </div>
        </div>

        {/* Student & Session Info Bar */}
        <div className="session-meta-strip">
          <div className="meta-col">
            <User size={14} className="text-cyan-400" />
            <span>Оқушы: <strong>{submission.studentName || 'Оқушы'}</strong></span>
          </div>
          <div className="meta-col">
            <FileText size={14} className="text-amber-400" />
            <span>Тест: <strong>{testTitle || submission.testTitle || 'ҰБТ Математика'}</strong></span>
          </div>
          <div className="meta-col">
            <Clock size={14} className="text-emerald-400" />
            <span>Уақыты: <strong>{new Date(submission.submittedAt || Date.now()).toLocaleTimeString('kk-KZ')}</strong></span>
          </div>
        </div>

        {/* Violations Chronological Timeline */}
        <div className="violations-timeline-section">
          <h4 className="timeline-heading">
            Оқиғалар Хронологиясы ({violations.length} оқиға)
          </h4>

          {violations.length === 0 ? (
            <div className="clean-timeline-banner">
              <CheckCircle2 size={32} className="text-emerald-400 mb-2" />
              <h5>Ешқандай ереже бұзушылық байқалмады!</h5>
              <p>Оқушы емтиханды толығымен бекітілген терезеде және камера бақылауымен өтті.</p>
            </div>
          ) : (
            <div className="timeline-items-list">
              {violations.map((v, idx) => (
                <div key={v.id || idx} className="timeline-item-row">
                  <div className="timeline-marker">
                    <span className="marker-dot" />
                    {idx < violations.length - 1 && <span className="marker-line" />}
                  </div>
                  <div className="timeline-content-box">
                    <div className="timeline-top">
                      <span className={`violation-tag ${v.type === 'Tab Switch' ? 'tag-tab' : 'tag-cam'}`}>
                        {v.type === 'Tab Switch' ? 'Терезе ауыстыру (Tab Switch)' : 'Камера өшірілді (Camera Off)'}
                      </span>
                      <span className="violation-time">
                        <Clock size={11} className="inline mr-1" />
                        {new Date(v.timestamp).toLocaleTimeString('kk-KZ', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="violation-reason-text">{v.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="report-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Жабу
          </button>
        </div>
      </div>
    </div>
  );
}


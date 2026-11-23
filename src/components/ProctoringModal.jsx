import React from 'react';
import { AlertTriangle, VideoOff, ShieldAlert, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';

export default function ProctoringModal({
  activeModal,
  onDismiss,
  onRetryCamera
}) {
  if (!activeModal) return null;

  const isDisqualified = activeModal.type === 'disqualified';
  const isCameraIssue = activeModal.type === 'camera_disconnected';

  return (
    <div className="modal-overlay proctoring-alert-overlay">
      <div className={`modal-card proctoring-modal-card ${isDisqualified ? 'card-disqualified' : isCameraIssue ? 'card-camera-alert' : 'card-warning'}`}>
        
        <div className="proctoring-modal-icon-wrap">
          {isDisqualified ? (
            <ShieldAlert size={44} className="text-rose-500 animate-bounce" />
          ) : isCameraIssue ? (
            <VideoOff size={44} className="text-amber-400" />
          ) : (
            <AlertTriangle size={44} className="text-amber-400" />
          )}
        </div>

        <h3 className="proctoring-modal-title">{activeModal.title}</h3>
        
        <p className="proctoring-modal-message">
          {activeModal.message}
        </p>

        {activeModal.type === 'tab_switch' && (
          <div className="warning-meter-box">
            <div className="meter-label">
              <span>Ескерту лимиті:</span>
              <strong>{activeModal.count || 1} / 3</strong>
            </div>
            <div className="meter-track">
              <div 
                className="meter-fill"
                style={{ 
                  width: `${((activeModal.count || 1) / 3) * 100}%`,
                  background: (activeModal.count || 1) >= 2 ? '#f43f5e' : '#f59e0b'
                }}
              />
            </div>
            <span className="meter-hint">
              3-ші ескертуден кейін тест автоматты түрде тоқтатылып, жүйе оны қабылдайды.
            </span>
          </div>
        )}

        {isCameraIssue && (
          <div className="camera-notice-box">
            <span className="notice-headline">⚠️ Тест таймері уақытша кідіртілді</span>
            <p>
              Камераны қосқанға дейін тест сұрақтарына жауап беруге рұқсат етілмейді. Браузердегі камера рұқсатын тексеріп, төмендегі батырманы басыңыз.
            </p>
          </div>
        )}

        <div className="proctoring-modal-actions">
          {isCameraIssue ? (
            <button
              className="btn btn-primary btn-lg"
              onClick={onRetryCamera}
            >
              <RefreshCw size={18} />
              <span>Камераны қайта қосу (Reconnect)</span>
            </button>
          ) : isDisqualified ? (
            <div className="auto-submit-pill">
              <span>Тест жүйеге жіберілуде...</span>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={onDismiss}
            >
              <CheckCircle size={18} />
              <span>Ережені түсіндім, тестіні жалғастыру</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


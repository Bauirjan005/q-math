import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Video, VideoOff, AlertTriangle, Eye, ChevronUp, ChevronDown } from 'lucide-react';

export default function ProctoringWidget({
  bindVideoRef,
  isCameraActive,
  isCameraPaused,
  warningCount = 0,
  maxWarnings = 3,
  violationsCount = 0,
  onRetryCamera
}) {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className={`proctoring-corner-widget ${isMinimized ? 'widget-minimized' : ''} ${warningCount > 0 ? 'has-warnings' : ''}`}>
      <div className="proctoring-widget-header" onClick={() => setIsMinimized(!isMinimized)}>
        <div className="header-status-left">
          <span className={`pulse-dot ${isCameraActive ? 'dot-active' : 'dot-alert'}`} />
          <div className="status-text-block">
            <span className="monitoring-label">
              {isCameraActive ? 'AI Прокторинг Белсенді' : 'Камера өшірулі!'}
            </span>
            <span className="monitoring-sub">
              {isCameraActive ? 'Жүйе бақылауда' : 'Таймер кідіртілді'}
            </span>
          </div>
        </div>

        <div className="header-actions-right">
          {warningCount > 0 && (
            <span className="warning-count-chip" title="Ескертулер саны">
              <AlertTriangle size={12} />
              {warningCount}/{maxWarnings}
            </span>
          )}
          <button 
            type="button" 
            className="btn-widget-toggle" 
            title={isMinimized ? 'Бейнені үлкейту' : 'Бейнені жию'}
          >
            {isMinimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="proctoring-widget-body">
          <div className="video-viewport">
            <video
              ref={bindVideoRef}
              autoPlay
              playsInline
              muted
              className="proctoring-live-video"
            />

            {!isCameraActive && (
              <div className="camera-offline-overlay">
                <VideoOff size={28} className="text-rose-400 mb-2" />
                <span className="text-xs text-rose-300 font-medium">Камера қосылмаған</span>
                {onRetryCamera && (
                  <button 
                    type="button"
                    className="btn btn-xs btn-retry-cam mt-2"
                    onClick={onRetryCamera}
                  >
                    Қайта қосу
                  </button>
                )}
              </div>
            )}

            {/* Subtle Overlay watermark */}
            <div className="video-hud-overlay">
              <span className="hud-tag">
                <Eye size={10} className="inline mr-1" />
                Live Feed
              </span>
              <span className="hud-time">
                {new Date().toLocaleTimeString('kk-KZ', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="proctoring-widget-footer">
            <div className="footer-metric">
              <span className="metric-name">Терезе ауыстыру:</span>
              <span className={`metric-val ${warningCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>
                {warningCount} / {maxWarnings}
              </span>
            </div>
            <div className="footer-metric">
              <span className="metric-name">Бұзушылық:</span>
              <span className={`metric-val ${violationsCount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                {violationsCount}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


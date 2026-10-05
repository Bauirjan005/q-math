import React from 'react';
import { Bell, Check, UserPlus, FileCheck, X, Clock } from 'lucide-react';

export default function NotificationPopover({ 
  notifications = [], 
  isOpen, 
  onClose, 
  onMarkRead, 
  onClearAll 
}) {
  if (!isOpen) return null;

  const formatTime = (isoString) => {
    try {
      const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diff < 60) return 'Дәл қазір';
      if (diff < 3600) return `${Math.floor(diff / 60)} мин бұрын`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} сағ бұрын`;
      return new Date(isoString).toLocaleDateString('kk-KZ', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="notif-popover-backdrop" onClick={onClose}>
      <div className="notif-popover-card" onClick={e => e.stopPropagation()}>
        <div className="notif-popover-header">
          <div className="notif-header-title">
            <Bell size={17} className="text-cyan-400" />
            <span>Мұғалімге Келген Хабарламалар ({notifications.length})</span>
          </div>

          <div className="notif-header-actions">
            {notifications.length > 0 && (
              <button className="btn-text-sm" onClick={onClearAll}>
                Барлығын оқылды деп белгілеу
              </button>
            )}
            <button className="notif-close-btn" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="notif-list-body">
          {notifications.length === 0 ? (
            <div className="notif-empty-state">
              <Bell size={32} className="text-muted" />
              <p>Әзірге жаңа хабарламалар жоқ</p>
              <span>Оқушылар тіркелгенде немесе тест тапсырғанда осында шығады</span>
            </div>
          ) : (
            notifications.map(n => {
              const isRegister = n.type === 'student_registered';

              return (
                <div 
                  key={n.id} 
                  className={`notif-item ${!n.read ? 'notif-unread' : ''}`}
                  onClick={() => onMarkRead(n.id)}
                >
                  <div className={`notif-type-icon ${isRegister ? 'icon-reg' : 'icon-sub'}`}>
                    {isRegister ? <UserPlus size={16} /> : <FileCheck size={16} />}
                  </div>

                  <div className="notif-content">
                    <div className="notif-item-top">
                      <span className="notif-item-title">{n.title}</span>
                      <span className="notif-time">
                        <Clock size={11} /> {formatTime(n.timestamp)}
                      </span>
                    </div>

                    <p className="notif-item-message">{n.message}</p>
                  </div>

                  {!n.read && <span className="unread-dot" />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

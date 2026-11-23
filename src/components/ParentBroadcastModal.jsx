import React, { useState } from 'react';
import { 
  Send, 
  Users, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Sparkles,
  MessageSquare,
  HelpCircle
} from 'lucide-react';

const BROADCAST_TEMPLATES = [
  {
    title: 'ҰБТ Байқау Сынағы Туралы',
    text: 'Құрметті ата-аналар! Осы сенбі күні сағат 10:00-де сынып оқушылары үшін ҰБТ онлайн сынақ емтиханы өткізіледі. Барлық оқушылардың уақытылы қатысуын қамтамасыз етуіңізді сұраймыз.'
  },
  {
    title: 'Үй Тапсырмасы мен Формулалар',
    text: 'Құрметті ата-аналар! Осы аптада тригонометрия және туынды тақырыптары бойынша жаңа тапсырмалар жүктелді. Оқушылардың Formula Trainer бөлімінде күнделікті 15 минут қайталауын қадағалауыңызды сұраймыз.'
  },
  {
    title: 'Айлық Дайындық Қорытындысы',
    text: 'Құрметті ата-аналар! Айлық тестілеу қорытындысы бойынша сыныптың орташа көрсеткіші өсуде. Әр оқушының жеке талдау есебін Q-Math жеке кабинетінен көре аласыздар.'
  }
];

export default function ParentBroadcastModal({
  isOpen,
  onClose,
  teacherClassroomCode = 'MATH-2026',
  connectedParentsCount = 0,
  onParentsUpdated
}) {
  const [title, setTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [isAddingDemoParents, setIsAddingDemoParents] = useState(false);

  if (!isOpen) return null;

  const handleApplyTemplate = (tmpl) => {
    setTitle(tmpl.title);
    setMessageText(tmpl.text);
  };

  const handleConnectDemoParents = async () => {
    setIsAddingDemoParents(true);
    try {
      const rawToken = localStorage.getItem('teacher_token');
      const token = (rawToken && rawToken.startsWith('teacher_tok_')) ? rawToken : 'teacher_tok_default';
      const res = await fetch('/api/demo-mode/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ enabled: true })
      });
      if (res.ok) {
        if (onParentsUpdated) await onParentsUpdated();
        setSendResult({
          success: true,
          deliveredCount: 3,
          isDemoInfo: true
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingDemoParents(false);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !messageText.trim()) {
      alert('Тақырып пен хабарлама мәтінін енгізіңіз');
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const rawToken = localStorage.getItem('teacher_token');
      const token = (rawToken && rawToken.startsWith('teacher_tok_')) ? rawToken : 'teacher_tok_default';
      const res = await fetch('/api/teacher/broadcast-parents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          classroomCode: teacherClassroomCode,
          title,
          messageText
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSendResult({
          success: true,
          deliveredCount: data.deliveredCount !== undefined ? data.deliveredCount : (connectedParentsCount || 0)
        });
      } else {
        setSendResult({
          success: false,
          error: data.error || 'Хабарламаны тарату қатесі'
        });
      }
    } catch (err) {
      const isNetErr = err.name === 'TypeError' || err.message?.toLowerCase().includes('fetch') || err.message?.toLowerCase().includes('network');
      setSendResult({
        success: false,
        error: isNetErr 
          ? 'Сервермен байланыс жоқ (NetworkError). Сервер қосулы екенін тексеріңіз (npm run dev).' 
          : err.message
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card parent-broadcast-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="report-modal-header">
          <div className="report-header-left">
            <div className="parent-telegram-icon-box">
              <Send size={24} className="text-sky-400" />
            </div>
            <div>
              <div className="report-pill">Мұғалім Модулі: Telegram Broadcast</div>
              <h3 className="report-title">Ата-аналарға Хабарлама Жіберу</h3>
              <p className="report-subtitle">
                {teacherClassroomCode} сыныбының байланыстырылған барлық ата-аналарына жедел хабарландыру тарату
              </p>
            </div>
          </div>

          <button className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Target Audience Strip */}
        <div className="broadcast-audience-bar">
          <div className="audience-item">
            <span className="aud-label">Сынып:</span>
            <strong className="aud-val text-amber-400">{teacherClassroomCode}</strong>
          </div>
          <div className="audience-item">
            <span className="aud-label">Байланысқан ата-аналар:</span>
            <strong className={`aud-val ${connectedParentsCount > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              <Users size={14} className="inline mr-1" />
              {connectedParentsCount} ата-ана
            </strong>
          </div>
          <div className="audience-item">
            <span className="aud-label">Жеткізу арнасы:</span>
            <span className="text-sky-400 font-semibold text-xs">Telegram Bot API (Шұғыл)</span>
          </div>
        </div>

        {connectedParentsCount === 0 && (
          <div className="alert-zero-parents-banner mb-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-400 shrink-0" />
              <span>
                {teacherClassroomCode} сыныбында әзірге Telegram ботқа байланысқан ата-аналар жоқ (0).
              </span>
            </div>
            <button
              type="button"
              className="btn btn-xs bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500/30 ml-2 shrink-0 flex items-center gap-1"
              onClick={handleConnectDemoParents}
              disabled={isAddingDemoParents}
            >
              <Sparkles size={12} />
              <span>{isAddingDemoParents ? 'Қосылуда...' : '+ 3 Демо-ата-ананы қосу'}</span>
            </button>
          </div>
        )}

        {/* Quick Templates Selection */}
        <div className="broadcast-templates-box">
          <span className="templates-label">
            <Sparkles size={13} className="inline mr-1 text-amber-400" />
            Дайын хабарлама шаблондары:
          </span>
          <div className="template-chips-grid">
            {BROADCAST_TEMPLATES.map((tmpl, i) => (
              <button
                key={i}
                type="button"
                className="btn-template-chip"
                onClick={() => handleApplyTemplate(tmpl)}
              >
                {tmpl.title}
              </button>
            ))}
          </div>
        </div>

        {/* Compose Form */}
        <form onSubmit={handleSendBroadcast} className="broadcast-form">
          <div className="form-group mb-3">
            <label className="input-field-label">Хабарлама тақырыбы:</label>
            <input
              type="text"
              className="broadcast-input"
              placeholder="Мысалы: ҰБТ байқау сынағы, үй тапсырмасы..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group mb-4">
            <label className="input-field-label">Хабарлама мәтіні:</label>
            <textarea
              className="broadcast-textarea"
              rows={5}
              placeholder="Құрметті ата-аналар! Оқушылардың ҰБТ-ға дайындық барысы бойынша..."
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              required
            />
          </div>

          {/* Success or Error Alert */}
          {sendResult && (
            <div className={`broadcast-result-alert ${sendResult.success ? 'alert-success' : 'alert-error'} mb-4`}>
              {sendResult.success ? (
                <>
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <div>
                    <strong>Хабарлама сәтті жіберілді!</strong>
                    <p className="text-xs">
                      {sendResult.deliveredCount > 0 ? (
                        `Хабарлама сыныптың ${sendResult.deliveredCount} ата-анасының Telegram ботына жеткізілді.`
                      ) : (
                        `Жүйе сұранысты қабылдады, бірақ сыныпта әзірге байланысқан ата-ана жоқ (0). Хабарлама нақты жетуі үшін жоғарыдағы «+3 Демо-ата-ананы қосу» батырмасын басыңыз немесе оқушылар ата-анасының Telegram-ын қосқан соң қайталаңыз.`
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle size={18} className="text-rose-400 shrink-0" />
                  <div>
                    <strong>Жіберу сәтсіз аяқталды</strong>
                    <p className="text-xs">{sendResult.error}</p>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="broadcast-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSending}>
              Болдырмау
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSending}>
              <Send size={16} />
              <span>{isSending ? 'Жіберілуде...' : 'Ата-аналарға тарату (Send)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


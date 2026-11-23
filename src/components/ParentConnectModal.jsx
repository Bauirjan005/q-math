import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Smartphone, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Bell, 
  ShieldCheck, 
  RefreshCw,
  Unlink,
  Sparkles
} from 'lucide-react';

export default function ParentConnectModal({
  isOpen,
  onClose,
  activeStudent,
  onStatusUpdated
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [parentPhone, setParentPhone] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Notification settings checkboxes
  const [settings, setSettings] = useState({
    onTestSubmitted: true,
    onLowScore: true,
    onInactivity: true,
    weeklyDigest: true
  });

  useEffect(() => {
    if (isOpen) {
      fetchParentContact();
    }
  }, [isOpen, activeStudent]);

  const fetchParentContact = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('student_token');
      const res = await fetch(`/api/student/parent-contact?studentId=${activeStudent?.id || ''}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setParentPhone(json.parentPhone || '');
        if (json.notificationSettings) {
          setSettings(json.notificationSettings);
        }
      }
    } catch (err) {
      console.error('Failed to load parent contact data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePhoneAndSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const token = localStorage.getItem('student_token');
      const res = await fetch('/api/student/parent-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          studentId: activeStudent?.id,
          parentPhone,
          notificationSettings: settings
        })
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSimulateBind = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/student/parent-contact/simulate-bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: activeStudent?.id })
      });
      if (res.ok) {
        await fetchParentContact();
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Ата-ананың Telegram байланысын үзгіңіз келетініне сенімдісіз бе?')) return;
    try {
      const res = await fetch('/api/student/parent-contact/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: activeStudent?.id })
      });
      if (res.ok) {
        await fetchParentContact();
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = () => {
    if (data?.deepLink) {
      navigator.clipboard.writeText(data.deepLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyCode = () => {
    if (data?.bindingToken) {
      navigator.clipboard.writeText(data.bindingToken);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  if (!isOpen) return null;

  const isConnected = data?.parentSyncStatus === 'connected';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card parent-connect-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="parent-modal-header">
          <div className="parent-header-left">
            <div className="parent-telegram-icon-box">
              <Send size={24} className="text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="parent-modal-title">Ата-ана Байланысы (Telegram Бот)</h3>
                <span className={`sync-status-badge ${isConnected ? 'status-connected' : 'status-pending'}`}>
                  {isConnected ? 'Қосулы (Connected) ✅' : 'Байланыспаған ⏳'}
                </span>
              </div>
              <p className="parent-modal-subtitle">
                Тест нәтижелерін, қателерді және дайындық есебін ата-анаңыздың Telegram-ына автоматты түрде жіберіңіз
              </p>
            </div>
          </div>

          <button className="btn-close-modal" onClick={onClose} title="Жабу">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted">
            <RefreshCw size={24} className="animate-spin inline mr-2 text-cyan-400" />
            <span>Мәліметтер жүктелуде...</span>
          </div>
        ) : (
          <div className="parent-modal-body">
            {/* Step 1: Connecting via Telegram */}
            <div className="connect-qr-card">
              <div className="qr-left-content">
                <span className="step-label">1-ҚАДАМ: TELEGRAM БОТҚА ТІРКЕЛУ</span>
                <h4>Ата-анаңыздың телефонынан QR-кодты сканерлеңіз немесе сілтемені жіберіңіз</h4>
                <p className="qr-desc">
                  Бот автоматты түрде іске қосылып, сіздің профиліңізді ата-анаңызға байланыстырады.
                </p>

                <div className="token-code-row">
                  <div className="binding-token-chip">
                    <span className="token-label">Байланыстыру коды:</span>
                    <strong className="token-value">{data?.bindingToken || 'BIND_MATH_2026'}</strong>
                  </div>
                  <button className="btn-copy-token" onClick={handleCopyCode} type="button">
                    {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copiedCode ? 'Көшірілді!' : 'Көшіру'}</span>
                  </button>
                </div>

                <div className="qr-action-btns">
                  <a
                    href={data?.deepLink || 'https://t.me/qmath_parent_bot'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-launch-telegram"
                  >
                    <Send size={16} />
                    <span>Telegram-да ашу (@{data?.botUsername || 'qmath_parent_bot'})</span>
                    <ExternalLink size={13} />
                  </a>

                  <button className="btn btn-secondary btn-copy-link" onClick={handleCopyLink} type="button">
                    {copiedLink ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                    <span>{copiedLink ? 'Сілтеме көшірілді!' : 'Сілтемені көшіру'}</span>
                  </button>
                </div>

                {!isConnected && (
                  <div className="simulate-test-row">
                    <button
                      type="button"
                      className="btn-simulate-bind"
                      onClick={handleSimulateBind}
                      disabled={isSimulating}
                      title="Байланыстыруды тестілеу үшін бір рет басыңыз"
                    >
                      <Sparkles size={14} className="text-amber-400" />
                      <span>{isSimulating ? 'Қосылуда...' : 'Демо: Ата-ананы жедел қосуды тексеру'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* QR Code Canvas Generator */}
              <div className="qr-right-box">
                <div className="qr-frame">
                  {/* Clean SVG Mocked QR Code Matrix for immediate scanning */}
                  <svg className="qr-svg-matrix" viewBox="0 0 140 140" width="130" height="130">
                    <rect width="140" height="140" fill="#ffffff" rx="8" />
                    {/* Finder Patterns */}
                    <rect x="10" y="10" width="35" height="35" fill="#0f172a" rx="4" />
                    <rect x="16" y="16" width="23" height="23" fill="#ffffff" rx="2" />
                    <rect x="22" y="22" width="11" height="11" fill="#0284c7" />

                    <rect x="95" y="10" width="35" height="35" fill="#0f172a" rx="4" />
                    <rect x="101" y="16" width="23" height="23" fill="#ffffff" rx="2" />
                    <rect x="107" y="22" width="11" height="11" fill="#0284c7" />

                    <rect x="10" y="95" width="35" height="35" fill="#0f172a" rx="4" />
                    <rect x="16" y="101" width="23" height="23" fill="#ffffff" rx="2" />
                    <rect x="22" y="107" width="11" height="11" fill="#0284c7" />

                    {/* QR Data Dots */}
                    <rect x="52" y="15" width="6" height="6" fill="#0f172a" />
                    <rect x="64" y="22" width="6" height="6" fill="#0284c7" />
                    <rect x="76" y="12" width="6" height="6" fill="#0f172a" />
                    <rect x="52" y="32" width="6" height="6" fill="#0f172a" />
                    <rect x="64" y="42" width="6" height="6" fill="#0f172a" />
                    <rect x="76" y="32" width="6" height="6" fill="#0284c7" />

                    <rect x="15" y="55" width="6" height="6" fill="#0f172a" />
                    <rect x="25" y="65" width="6" height="6" fill="#0284c7" />
                    <rect x="35" y="75" width="6" height="6" fill="#0f172a" />
                    <rect x="55" y="55" width="8" height="8" fill="#0284c7" />
                    <rect x="68" y="65" width="6" height="6" fill="#0f172a" />
                    <rect x="78" y="55" width="6" height="6" fill="#0f172a" />
                    <rect x="95" y="60" width="8" height="8" fill="#0f172a" />
                    <rect x="110" y="70" width="6" height="6" fill="#0284c7" />

                    <rect x="52" y="85" width="6" height="6" fill="#0f172a" />
                    <rect x="64" y="95" width="6" height="6" fill="#0284c7" />
                    <rect x="76" y="85" width="6" height="6" fill="#0f172a" />
                    <rect x="52" y="105" width="6" height="6" fill="#0284c7" />
                    <rect x="64" y="115" width="6" height="6" fill="#0f172a" />
                    <rect x="76" y="105" width="6" height="6" fill="#0f172a" />

                    <rect x="95" y="95" width="6" height="6" fill="#0f172a" />
                    <rect x="105" y="105" width="6" height="6" fill="#0284c7" />
                    <rect x="115" y="95" width="6" height="6" fill="#0f172a" />
                    <rect x="100" y="118" width="6" height="6" fill="#0f172a" />
                    <rect x="115" y="118" width="6" height="6" fill="#0284c7" />
                  </svg>
                  <span className="qr-hint-tag">Камерамен сканерлеңіз</span>
                </div>
              </div>
            </div>

            {/* Step 2: Parent Phone & Notification Triggers */}
            <div className="parent-settings-grid">
              <div className="phone-input-col">
                <span className="step-label">2-ҚАДАМ: БАЙЛАНЫС НӨМІРІ (SMS/WHATSAPP)</span>
                <label className="input-field-label">Ата-ананың телефон нөмірі:</label>
                <div className="phone-input-wrap">
                  <Smartphone size={16} className="text-muted" />
                  <input
                    type="tel"
                    placeholder="+7 (701) 000-00-00"
                    value={parentPhone}
                    onChange={e => setParentPhone(e.target.value)}
                    className="parent-phone-input"
                  />
                </div>
                <span className="text-xs text-muted mt-1 block">
                  Телефон нөмірі маңызды ескертулер мен SMS резервтік хабарламалар үшін қажет.
                </span>

                {isConnected && (
                  <button
                    type="button"
                    className="btn btn-xs btn-disconnect-link mt-4"
                    onClick={handleDisconnect}
                  >
                    <Unlink size={13} />
                    <span>Telegram байланысын ажырату</span>
                  </button>
                )}
              </div>

              {/* Automated Event Notification Triggers */}
              <div className="triggers-selection-col">
                <span className="step-label">АВТОМАТТЫ ХАБАРЛАМАЛАРДЫ БАПТАУ</span>
                <div className="toggles-list">
                  <label className="trigger-checkbox-row">
                    <input
                      type="checkbox"
                      checked={settings.onTestSubmitted}
                      onChange={e => setSettings({ ...settings, onTestSubmitted: e.target.checked })}
                    />
                    <div className="trigger-text">
                      <strong>📝 Тест аяқталғанда жедел нәтиже</strong>
                      <span>Жинаған балл, пайыз және қателердің талдауы бірден жіберіледі.</span>
                    </div>
                  </label>

                  <label className="trigger-checkbox-row">
                    <input
                      type="checkbox"
                      checked={settings.onLowScore}
                      onChange={e => setSettings({ ...settings, onLowScore: e.target.checked })}
                    />
                    <div className="trigger-text">
                      <strong>⚠️ Төмен балл алғанда ескерту (&lt;50%)</strong>
                      <span>Сынақ шекті балынан өтпеген жағдайда ата-анаға бірден ескерту келеді.</span>
                    </div>
                  </label>

                  <label className="trigger-checkbox-row">
                    <input
                      type="checkbox"
                      checked={settings.onInactivity}
                      onChange={e => setSettings({ ...settings, onInactivity: e.target.checked })}
                    />
                    <div className="trigger-text">
                      <strong>⏰ 3 күн сабақ оқымаса хабарлау</strong>
                      <span>Оқушы 3 күн қатарынан жаттығу жасамаса, бот ата-анаға ескертеді.</span>
                    </div>
                  </label>

                  <label className="trigger-checkbox-row">
                    <input
                      type="checkbox"
                      checked={settings.weeklyDigest}
                      onChange={e => setSettings({ ...settings, weeklyDigest: e.target.checked })}
                    />
                    <div className="trigger-text">
                      <strong>📊 Апталық дайындық дайджесті</strong>
                      <span>Әр жексенбіде апта бойы жұмсалған уақыт пен XP қорытындысы.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="parent-modal-footer">
              {saveSuccess && (
                <div className="save-success-indicator">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>Баптаулар сәтті сақталды!</span>
                </div>
              )}

              <button
                className="btn btn-secondary"
                onClick={onClose}
              >
                Жабу
              </button>

              <button
                className="btn btn-primary"
                onClick={handleSavePhoneAndSettings}
                disabled={isSaving}
              >
                {isSaving ? 'Сақталуда...' : 'Баптауларды сақтау'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  PenTool, 
  BookOpen, 
  AlertCircle,
  HelpCircle,
  X,
  CheckCircle2
} from 'lucide-react';
import MathRenderer from '../../components/MathRenderer';
import Scratchpad from '../../components/Scratchpad';
import FormulaSheetModal from '../../components/FormulaSheetModal';

export default function TestRunner({ 
  test, 
  activeStudent, 
  onFinishTest, 
  onCancel 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { qId: 'A' }
  const [flagged, setFlagged] = useState({}); // { qId: true }
  const [timeLeft, setTimeLeft] = useState((test.durationMinutes || 30) * 60);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isFormulaOpen, setIsFormulaOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startTimeRef = useRef(Date.now());
  const questions = test.questions || [];
  const currentQ = questions[currentIndex];

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in a modal or input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'ArrowRight' && currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (['a', 'A', '1'].includes(e.key)) {
        selectOption('A');
      } else if (['b', 'B', '2'].includes(e.key)) {
        selectOption('B');
      } else if (['c', 'C', '3'].includes(e.key)) {
        selectOption('C');
      } else if (['d', 'D', '4'].includes(e.key)) {
        selectOption('D');
      } else if (['e', 'E', '5'].includes(e.key)) {
        selectOption('E');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentQ]);

  const selectOption = (optKey) => {
    if (!currentQ) return;
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: optKey
    }));
  };

  const toggleFlag = (qId) => {
    setFlagged(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleAutoSubmit = () => {
    submitExam();
  };

  const submitExam = async () => {
    setIsSubmitting(true);
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: test.id,
          studentId: activeStudent.id,
          studentName: activeStudent.name,
          answers,
          durationSeconds
        })
      });

      if (!res.ok) {
        throw new Error('Тапсыруды тіркеу қатесі');
      }

      const data = await res.json();
      setIsSubmitting(false);
      onFinishTest(data.submission, test);
    } catch (err) {
      console.error(err);
      alert('Қате: ' + err.message);
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const isTimeCritical = timeLeft < 300; // < 5 mins

  if (!currentQ) {
    return <div className="p-8 text-center">Сұрақтар табылмады.</div>;
  }

  return (
    <div className="test-runner-layout">
      {/* Top Test Header Bar */}
      <div className="test-runner-top-bar">
        <div className="bar-meta-left">
          <div className="test-name-tag">{test.title}</div>
          <div className="student-badge-pill">Оқушы: {activeStudent.name}</div>
        </div>

        {/* Center: Countdown Timer */}
        <div className={`countdown-timer-box ${isTimeCritical ? 'timer-alert' : ''}`}>
          <Clock size={18} />
          <span className="timer-text">{formatTimer(timeLeft)}</span>
          {isTimeCritical && <span className="timer-warning-tag">Уақыт аз қалды!</span>}
        </div>

        {/* Right Tools: Scratchpad, Formulas, Finish */}
        <div className="bar-actions-right">
          <button
            className={`btn-tool ${isScratchpadOpen ? 'active' : ''}`}
            onClick={() => setIsScratchpadOpen(!isScratchpadOpen)}
            title="Жобалау парағын ашу (Черновик)"
          >
            <PenTool size={16} />
            <span>Черновик</span>
          </button>

          <button
            className="btn-tool"
            onClick={() => setIsFormulaOpen(true)}
            title="Формулалар анықтамалығы"
          >
            <BookOpen size={16} />
            <span>Формулалар</span>
          </button>

          <button
            className="btn btn-primary btn-finish-exam"
            onClick={() => setShowConfirmModal(true)}
          >
            <Send size={15} />
            <span>Тестті аяқтау</span>
          </button>
        </div>
      </div>

      {/* Main Examination Workspace */}
      <div className="exam-workspace-grid">
        {/* Left Side: Question Navigation Grid (UNT Standard) */}
        <div className="nav-palette-panel">
          <div className="palette-header">
            <h4>ҰБТ Навигаторы</h4>
            <div className="palette-summary">
              <span>{answeredCount}/{questions.length} жауап берілді</span>
            </div>
          </div>

          <div className="palette-grid">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = idx === currentIndex;
              const isFlag = !!flagged[q.id];

              let cellClass = 'pal-cell';
              if (isCurrent) cellClass += ' pal-current';
              if (isAnswered) cellClass += ' pal-answered';
              if (isFlag) cellClass += ' pal-flagged';

              return (
                <button
                  key={q.id}
                  className={cellClass}
                  onClick={() => setCurrentIndex(idx)}
                >
                  <span className="pal-num">{idx + 1}</span>
                  {isFlag && <span className="flag-dot">★</span>}
                </button>
              );
            })}
          </div>

          <div className="palette-legend">
            <div className="legend-row">
              <span className="legend-box pal-answered" /> Жауап берілген
            </div>
            <div className="legend-row">
              <span className="legend-box pal-current" /> Ағымдағы сұрақ
            </div>
            <div className="legend-row">
              <span className="legend-box pal-flagged" /> Қайта қарауға белгіленген (★)
            </div>
          </div>

          <div className="keyboard-shortcuts-hint">
            <strong>Пернетақта көмекшісі:</strong>
            <p>1-5 немесе A-E — нұсқаны таңдау</p>
            <p>← / → — сұрақтар арасында өту</p>
          </div>
        </div>

        {/* Right / Center: Active Question Card */}
        <div className="question-runner-pane">
          <div className="question-header-row">
            <div className="q-badge-wrap">
              <span className="q-num-label">Сұрақ #{currentIndex + 1} / {questions.length}</span>
              <span className="q-pts-tag">{currentQ.points || 1} ұпай</span>
            </div>

            <button
              className={`btn-flag ${flagged[currentQ.id] ? 'is-flagged' : ''}`}
              onClick={() => toggleFlag(currentQ.id)}
            >
              <Flag size={15} />
              <span>{flagged[currentQ.id] ? 'Белгіленген (★)' : 'Қайта қарауға белгілеу'}</span>
            </button>
          </div>

          {/* Question Text */}
          <div className="runner-question-text">
            <MathRenderer text={currentQ.question} />
          </div>

          {/* Options List */}
          <div className="runner-options-list">
            {currentQ.options.map(opt => {
              const isSelected = answers[currentQ.id] === opt.key;

              return (
                <div
                  key={opt.key}
                  className={`runner-option-card ${isSelected ? 'option-selected' : ''}`}
                  onClick={() => selectOption(opt.key)}
                >
                  <div className="opt-radio-icon">
                    <span className="opt-key">{opt.key}</span>
                  </div>
                  <div className="opt-text-display">
                    <MathRenderer text={opt.text} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="runner-nav-footer">
            <button
              className="btn btn-secondary btn-nav"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(currentIndex - 1)}
            >
              <ChevronLeft size={18} />
              <span>Алдыңғы сұрақ</span>
            </button>

            <span className="progress-fraction">
              {currentIndex + 1} / {questions.length}
            </span>

            {currentIndex < questions.length - 1 ? (
              <button
                className="btn btn-primary btn-nav"
                onClick={() => setCurrentIndex(currentIndex + 1)}
              >
                <span>Келесі сұрақ</span>
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                className="btn btn-primary btn-nav btn-finish-last"
                onClick={() => setShowConfirmModal(true)}
              >
                <span>Тестті аяқтау & Тапсыру</span>
                <Send size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Scratchpad Overlay */}
      <Scratchpad
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
      />

      {/* Formula Sheet Reference Modal */}
      <FormulaSheetModal
        isOpen={isFormulaOpen}
        onClose={() => setIsFormulaOpen(false)}
      />

      {/* Confirmation Submit Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-card confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon-wrap">
              <CheckCircle2 size={36} className="text-emerald-400" />
            </div>
            <h3 className="confirm-title">Тестті аяқтауға дайынсыз ба?</h3>
            <p className="confirm-text">
              Сіз барлығы <strong>{questions.length}</strong> сұрақтың <strong>{answeredCount}</strong>-не жауап бердіңіз.
              {unansweredCount > 0 && (
                <span className="unanswered-warning">
                  <br />Назар аударыңыз: {unansweredCount} сұрақ белгіленбеген!
                </span>
              )}
            </p>

            <div className="confirm-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
              >
                Тестіні жалғастыру
              </button>
              <button
                className="btn btn-primary"
                onClick={submitExam}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Бағалануда...' : 'Иә, тестті тапсыру'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

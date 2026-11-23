import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Flame, 
  Sparkles, 
  Award, 
  RotateCcw, 
  Check, 
  X, 
  HelpCircle, 
  ArrowRight, 
  ChevronRight, 
  Compass, 
  TrendingUp, 
  Binary, 
  Shapes, 
  Shuffle, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Brain,
  Lightbulb,
  Keyboard,
  ListFilter
} from 'lucide-react';
import { BlockMath, InlineMath } from './MathRenderer';
import { FORMULA_CATEGORIES } from '../data/formulaData';
import { 
  generateFlashcardsBank, 
  calculateSM2, 
  REPETITION_RATINGS, 
  XP_REWARDS, 
  getSavedRepetitionCards, 
  saveRepetitionCards, 
  getTrainerStats, 
  saveTrainerStats,
  normalizeMathString
} from '../utils/spacedRepetition';

const CATEGORY_ICONS = {
  trig: Compass,
  calculus: TrendingUp,
  algebra: Binary,
  geometry: Shapes,
  probability: Shuffle
};

export default function FormulaTrainer({ onBackToDashboard, onOpenFormulaBank }) {
  // All cards built directly from Formula Bank
  const allCards = useMemo(() => generateFlashcardsBank(), []);

  // Filter & Queue State
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'due' | 'learning'
  const [inputMode, setInputMode] = useState('quiz'); // 'quiz' | 'type'
  
  // Progress & Spaced Repetition Map
  const [repMap, setRepMap] = useState(() => getSavedRepetitionCards());
  const [stats, setStats] = useState(() => getTrainerStats());
  
  // Active Practice Session
  const [sessionQueue, setSessionQueue] = useState([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [answerEvaluated, setAnswerEvaluated] = useState(false);
  const [isTypedCorrect, setIsTypedCorrect] = useState(null);
  
  // Session Summary State
  const [sessionFinished, setSessionFinished] = useState(false);
  const [sessionResults, setSessionResults] = useState({
    mastered: [],
    needsReview: [],
    xpEarned: 0,
    totalAnswered: 0
  });

  const cardContainerRef = useRef(null);

  const startNewSession = useCallback((catId = 'all', mode = 'all') => {
    let pool = allCards;
    if (catId !== 'all') {
      pool = pool.filter(c => c.categoryId === catId);
    }

    const now = new Date();
    if (mode === 'due') {
      pool = pool.filter(c => {
        const record = repMap[c.id];
        if (!record) return true; // new cards are due
        return new Date(record.nextReviewDate) <= now;
      });
    } else if (mode === 'learning') {
      pool = pool.filter(c => {
        const record = repMap[c.id];
        return record && record.repetitions < 2;
      });
    }

    // Default to a focused batch of 10-15 cards, shuffled
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const queue = shuffled.slice(0, 15);

    setSessionQueue(queue);
    setSessionIndex(0);
    setIsRevealed(false);
    setSelectedOption(null);
    setTypedAnswer('');
    setAnswerEvaluated(false);
    setIsTypedCorrect(null);
    setSessionFinished(false);
    setSessionResults({
      mastered: [],
      needsReview: [],
      xpEarned: 0,
      totalAnswered: 0
    });
  }, [allCards, repMap]);

  // Initialize or re-filter session queue
  useEffect(() => {
    startNewSession(selectedCategory, filterMode);
  }, [selectedCategory, filterMode, startNewSession]);

  const currentCard = sessionQueue[sessionIndex];

  const handleSelectQuizOption = useCallback((option) => {
    if (!option || isRevealed) return;
    setSelectedOption(option);
    setIsRevealed(true);
    setAnswerEvaluated(true);
  }, [isRevealed]);

  const handleCheckTypedAnswer = useCallback(() => {
    if (!typedAnswer.trim() || !currentCard) return;
    const cleanTyped = normalizeMathString(typedAnswer);
    const cleanTarget = normalizeMathString(currentCard.rhs);

    // Flexible check
    const isMatch = cleanTyped === cleanTarget || 
                    cleanTarget.includes(cleanTyped) || 
                    cleanTyped.includes(cleanTarget);

    setIsTypedCorrect(isMatch);
    setIsRevealed(true);
    setAnswerEvaluated(true);
  }, [typedAnswer, currentCard]);

  const handleRateCard = useCallback((qualityRating) => {
    if (!currentCard) return;

    const existingRecord = repMap[currentCard.id] || {
      repetitions: 0,
      interval: 1,
      easeFactor: 2.5
    };

    // Calculate SM-2 update
    const updatedRecord = calculateSM2(existingRecord, qualityRating);
    const updatedMap = {
      ...repMap,
      [currentCard.id]: updatedRecord
    };

    setRepMap(updatedMap);
    saveRepetitionCards(updatedMap);

    // XP calculation
    let xpGained = XP_REWARDS.GOOD;
    if (qualityRating === REPETITION_RATINGS.EASY) xpGained = XP_REWARDS.EASY;
    if (qualityRating === REPETITION_RATINGS.HARD) xpGained = XP_REWARDS.HARD;
    if (qualityRating === REPETITION_RATINGS.AGAIN) xpGained = XP_REWARDS.AGAIN;

    // Update global stats
    const updatedStats = {
      ...stats,
      totalXP: stats.totalXP + xpGained,
      totalReviews: stats.totalReviews + 1,
      lastPracticedDate: new Date().toISOString()
    };
    setStats(updatedStats);
    saveTrainerStats(updatedStats);

    // Track session stats
    const isMastered = qualityRating >= REPETITION_RATINGS.GOOD;
    setSessionResults(prev => ({
      ...prev,
      xpEarned: prev.xpEarned + xpGained,
      totalAnswered: prev.totalAnswered + 1,
      mastered: isMastered 
        ? [...prev.mastered, currentCard] 
        : prev.mastered,
      needsReview: !isMastered 
        ? [...prev.needsReview, currentCard] 
        : prev.needsReview
    }));

    // Handle "Again" by appending back into session queue if failed
    let nextQueue = [...sessionQueue];
    if (qualityRating === REPETITION_RATINGS.AGAIN) {
      nextQueue.push(currentCard);
      setSessionQueue(nextQueue);
    }

    // Move to next card or finish session
    if (sessionIndex + 1 < nextQueue.length) {
      setSessionIndex(sessionIndex + 1);
      setIsRevealed(false);
      setSelectedOption(null);
      setTypedAnswer('');
      setAnswerEvaluated(false);
      setIsTypedCorrect(null);
    } else {
      // Session Complete!
      setSessionFinished(true);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.55 }
      });
    }
  }, [currentCard, repMap, stats, sessionQueue, sessionIndex]);

  // Quick keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (sessionFinished || !currentCard) return;

      // When typing in text input, don't trigger shortcuts
      if (document.activeElement && document.activeElement.tagName === 'INPUT') {
        if (e.key === 'Enter' && !isRevealed) {
          handleCheckTypedAnswer();
        }
        return;
      }

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!isRevealed) {
          setIsRevealed(true);
        }
      } else if (isRevealed) {
        if (e.key === '1') handleRateCard(REPETITION_RATINGS.AGAIN);
        if (e.key === '2') handleRateCard(REPETITION_RATINGS.HARD);
        if (e.key === '3') handleRateCard(REPETITION_RATINGS.GOOD);
        if (e.key === '4') handleRateCard(REPETITION_RATINGS.EASY);
      } else if (inputMode === 'quiz' && currentCard.options) {
        if (['1', 'a', 'A'].includes(e.key) && currentCard.options[0]) handleSelectQuizOption(currentCard.options[0]);
        if (['2', 'b', 'B'].includes(e.key) && currentCard.options[1]) handleSelectQuizOption(currentCard.options[1]);
        if (['3', 'c', 'C'].includes(e.key) && currentCard.options[2]) handleSelectQuizOption(currentCard.options[2]);
        if (['4', 'd', 'D'].includes(e.key) && currentCard.options[3]) handleSelectQuizOption(currentCard.options[3]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRevealed, currentCard, sessionFinished, inputMode, handleCheckTypedAnswer, handleRateCard, handleSelectQuizOption]);

  const handleAppendMathSymbol = (sym) => {
    setTypedAnswer(prev => prev + sym);
  };

  // Quick helper for mastery status count
  const dueCount = useMemo(() => {
    const now = new Date();
    return allCards.filter(c => {
      const r = repMap[c.id];
      return !r || new Date(r.nextReviewDate) <= now;
    }).length;
  }, [allCards, repMap]);

  return (
    <div className="formula-trainer-container">
      {/* Top Gamification Header */}
      <div className="trainer-header-card">
        <div className="trainer-header-left">
          <div className="trainer-icon-badge">
            <Sparkles size={24} className="text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="trainer-title">Формулалар Жаттықтырушысы</h2>
              <span className="anki-badge">SM-2 Spaced Repetition</span>
            </div>
            <p className="trainer-subtitle">
              Интервалды қайталау арқылы ҰБТ математика формулаларын мәңгі есте сақтаңыз
            </p>
          </div>
        </div>

        {/* Gamification Counters: Streak & XP */}
        <div className="trainer-stats-row">
          <div className="trainer-stat-pill streak-pill" title="Күнделікті үздіксіз жаттығу сериясы">
            <Flame size={18} className="text-amber-400" />
            <div className="stat-meta">
              <span className="stat-val">{stats.streakDays} күн</span>
              <span className="stat-lbl">Үздіксіз серия</span>
            </div>
          </div>

          <div className="trainer-stat-pill xp-pill" title="Жинаған тәжірибе ұпайлары">
            <Award size={18} className="text-cyan-400" />
            <div className="stat-meta">
              <span className="stat-val">{stats.totalXP} XP</span>
              <span className="stat-lbl">Барлық деңгей</span>
            </div>
          </div>

          <div className="trainer-stat-pill review-pill" title="Бүгін қайталауды қажет ететін формулалар">
            <Layers size={18} className="text-emerald-400" />
            <div className="stat-meta">
              <span className="stat-val">{dueCount}</span>
              <span className="stat-lbl">Қайталау керек</span>
            </div>
          </div>

          {onOpenFormulaBank && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onOpenFormulaBank}
              title="Ресми Формулалар Банкін ашу"
            >
              <BookOpen size={15} />
              <span>Формулалар Базасы</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Controls: Categories & Modes */}
      <div className="trainer-controls-bar">
        {/* Categories Tabs */}
        <div className="category-chips-list">
          <button
            className={`cat-chip ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            <span>Барлық тақырыптар ({allCards.length})</span>
          </button>
          {FORMULA_CATEGORIES.map(cat => {
            const Icon = CATEGORY_ICONS[cat.id] || Compass;
            return (
              <button
                key={cat.id}
                className={`cat-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <Icon size={14} />
                <span>{cat.name} ({cat.formulas.length})</span>
              </button>
            );
          })}
        </div>

        {/* Filter & Input Mode Selector */}
        <div className="mode-toggle-group">
          <div className="filter-pill-select">
            <button
              className={`pill-btn ${filterMode === 'all' ? 'active' : ''}`}
              onClick={() => setFilterMode('all')}
            >
              Барлығы
            </button>
            <button
              className={`pill-btn ${filterMode === 'due' ? 'active' : ''}`}
              onClick={() => setFilterMode('due')}
              title="Бүгінгі күнге жоспарланған формулалар"
            >
              Қайталау керек ({dueCount})
            </button>
          </div>

          <div className="filter-pill-select">
            <button
              className={`pill-btn ${inputMode === 'quiz' ? 'active' : ''}`}
              onClick={() => setInputMode('quiz')}
              title="Жылдам жауап нұсқалары"
            >
              Нұсқалар (Quiz)
            </button>
            <button
              className={`pill-btn ${inputMode === 'type' ? 'active' : ''}`}
              onClick={() => setInputMode('type')}
              title="Өз қолыңызбен енгізу"
            >
              <Keyboard size={13} className="inline mr-1" />
              Енгізу (Input)
            </button>
          </div>
        </div>
      </div>

      {/* Main Flashcard View OR Session Summary */}
      {!sessionFinished && currentCard ? (
        <div className="trainer-card-layout">
          {/* Progress Bar */}
          <div className="session-progress-strip">
            <div className="progress-label">
              <span>Карта <strong>{sessionIndex + 1}</strong> / {sessionQueue.length}</span>
              <span className="text-muted text-xs">
                {Math.round(((sessionIndex + 1) / sessionQueue.length) * 100)}% орындалды
              </span>
            </div>
            <div className="progress-bar-track">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${((sessionIndex + 1) / sessionQueue.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Gamified Flashcard Body */}
          <div className="flashcard-container" ref={cardContainerRef}>
            <div className={`gamified-card ${isRevealed ? 'card-revealed' : ''}`}>
              {/* Card Header */}
              <div className="card-top-meta">
                <div className="flex items-center gap-2">
                  <span className="cat-tag-badge">{currentCard.categoryName}</span>
                  <span className="sub-tag-badge">{currentCard.tag}</span>
                </div>
                <div className="difficulty-indicator">
                  <span className="card-rep-state">
                    {repMap[currentCard.id] 
                      ? `${repMap[currentCard.id].repetitions} рет қайталанған` 
                      : 'Жаңа формула'}
                  </span>
                </div>
              </div>

              {/* Card Question / Prompt */}
              <div className="card-question-box">
                <h3 className="formula-name-heading">{currentCard.name}</h3>
                
                <div className="formula-display-window">
                  {!isRevealed ? (
                    <div className="masked-latex-view">
                      <BlockMath math={currentCard.maskedLatex} />
                      <div className="mask-hint-text">
                        Оң жақ бөлігіндегі сұрақтың (?) орнына не келуі керек?
                      </div>
                    </div>
                  ) : (
                    <div className="revealed-latex-view">
                      <BlockMath math={currentCard.fullLatex} />
                    </div>
                  )}
                </div>
              </div>

              {/* Interactive Practice Zone: Options or Type-in */}
              {!isRevealed ? (
                <div className="card-practice-area">
                  {inputMode === 'quiz' ? (
                    <div className="quiz-options-grid">
                      {currentCard.options.map(opt => (
                        <button
                          key={opt.key}
                          className="quiz-option-btn"
                          onClick={() => handleSelectQuizOption(opt)}
                        >
                          <span className="opt-key-chip">{opt.key}</span>
                          <div className="opt-math-content">
                            <InlineMath math={opt.text} />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="type-input-area">
                      <div className="input-row">
                        <input
                          type="text"
                          className="formula-text-input"
                          placeholder="Жауапты жазыңыз, мысалы: 2sin a cos a немесе 2\sin\alpha\cos\alpha..."
                          value={typedAnswer}
                          onChange={e => setTypedAnswer(e.target.value)}
                          autoFocus
                        />
                        <button
                          className="btn btn-primary btn-check-answer"
                          onClick={handleCheckTypedAnswer}
                          disabled={!typedAnswer.trim()}
                        >
                          <Check size={16} />
                          <span>Тексеру</span>
                        </button>
                      </div>

                      {/* Quick Math Symbols Keypad */}
                      <div className="quick-symbol-keypad">
                        <span className="keypad-title">Жылдам белгілер:</span>
                        {[
                          { label: 'sin', val: '\\sin ' },
                          { label: 'cos', val: '\\cos ' },
                          { label: 'tg', val: '\\operatorname{tg} ' },
                          { label: 'ctg', val: '\\operatorname{ctg} ' },
                          { label: 'α', val: '\\alpha ' },
                          { label: 'β', val: '\\beta ' },
                          { label: 'x²', val: '^2' },
                          { label: '√x', val: '\\sqrt{}' },
                          { label: 'a/b', val: '\\frac{}{}' },
                          { label: 'π', val: '\\pi ' },
                          { label: 'ln', val: '\\ln ' },
                          { label: '·', val: '\\cdot ' }
                        ].map(btn => (
                          <button
                            key={btn.label}
                            type="button"
                            className="math-key-btn"
                            onClick={() => handleAppendMathSymbol(btn.val)}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="reveal-action-row">
                    <button
                      className="btn btn-secondary btn-reveal-full"
                      onClick={() => setIsRevealed(true)}
                    >
                      <Lightbulb size={16} className="text-amber-400" />
                      <span>Жауапты көрсету (Бос орын / Space)</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Revealed Side: Explanations & SM-2 Ratings */
                <div className="card-revealed-zone">
                  {/* Feedback on answer */}
                  {answerEvaluated && (
                    <div className={`answer-feedback-banner ${
                      (selectedOption && selectedOption.isCorrect) || isTypedCorrect 
                        ? 'feedback-correct' 
                        : 'feedback-wrong'
                    }`}>
                      {((selectedOption && selectedOption.isCorrect) || isTypedCorrect) ? (
                        <>
                          <CheckCircle2 size={20} className="text-emerald-400" />
                          <div>
                            <strong>Дұрыс! Өте жақсы!</strong>
                            <p className="text-xs">Формула есте сақтау жадыңызға бекітілді.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={20} className="text-rose-400" />
                          <div>
                            <strong>Қателестіңіз немесе толық емес</strong>
                            <p className="text-xs">Дұрыс формулаға мұқият назар аударып, есіңізде қайталаңыз.</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Note & Practical Exam Tip */}
                  {currentCard.note && (
                    <div className="formula-note-box">
                      <Lightbulb size={16} className="text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <strong>ҰБТ Кеңесі & Қолданылуы:</strong>
                        <p>{currentCard.note}</p>
                      </div>
                    </div>
                  )}

                  {/* Spaced Repetition (SM-2) Rating Controls */}
                  <div className="sm2-rating-section">
                    <div className="rating-prompt">Формуланы қаншалықты оңай еске түсірдіңіз?</div>
                    <div className="rating-buttons-grid">
                      <button
                        className="sm2-btn btn-again"
                        onClick={() => handleRateCard(REPETITION_RATINGS.AGAIN)}
                        title="Перне: 1"
                      >
                        <div className="rate-num">1</div>
                        <div className="rate-title">Қайталау (Again)</div>
                        <div className="rate-interval">&lt; 1 мин</div>
                      </button>

                      <button
                        className="sm2-btn btn-hard"
                        onClick={() => handleRateCard(REPETITION_RATINGS.HARD)}
                        title="Перне: 2 (+5 XP)"
                      >
                        <div className="rate-num">2</div>
                        <div className="rate-title">Қиын (Hard)</div>
                        <div className="rate-interval">1 күн • +5 XP</div>
                      </button>

                      <button
                        className="sm2-btn btn-good"
                        onClick={() => handleRateCard(REPETITION_RATINGS.GOOD)}
                        title="Перне: 3 (+10 XP)"
                      >
                        <div className="rate-num">3</div>
                        <div className="rate-title">Жақсы (Good)</div>
                        <div className="rate-interval">4 күн • +10 XP</div>
                      </button>

                      <button
                        className="sm2-btn btn-easy"
                        onClick={() => handleRateCard(REPETITION_RATINGS.EASY)}
                        title="Перне: 4 (+15 XP)"
                      >
                        <div className="rate-num">4</div>
                        <div className="rate-title">Оңай (Easy)</div>
                        <div className="rate-interval">10 күн • +15 XP</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : sessionFinished ? (
        /* Progress Summary Screen at End of Session */
        <div className="session-summary-card">
          <div className="summary-header">
            <div className="celebrate-badge">
              <Award size={36} className="text-amber-400" />
            </div>
            <h2 className="summary-title">Жаттығу Сәтті Аяқталды! 🎉</h2>
            <p className="summary-subtitle">
              Сіз <strong>{sessionResults.mastered.length}</strong> формуланы меңгердіңіз,{' '}
              <strong>{sessionResults.needsReview.length}</strong> формула қайталауды қажет етеді.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="summary-stats-grid">
            <div className="summary-kpi">
              <div className="kpi-value text-emerald-400">{sessionResults.mastered.length}</div>
              <div className="kpi-label">Меңгерілген формулалар</div>
            </div>

            <div className="summary-kpi">
              <div className="kpi-value text-amber-400">{sessionResults.needsReview.length}</div>
              <div className="kpi-label">Қайталау керек</div>
            </div>

            <div className="summary-kpi">
              <div className="kpi-value text-cyan-400">+{sessionResults.xpEarned}</div>
              <div className="kpi-label">Жинаған XP ұпай</div>
            </div>

            <div className="summary-kpi">
              <div className="kpi-value text-purple-400">
                {sessionResults.totalAnswered > 0 
                  ? Math.round((sessionResults.mastered.length / sessionResults.totalAnswered) * 100) 
                  : 0}%
              </div>
              <div className="kpi-label">Дәлдік деңгейі</div>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="session-breakdown-box">
            <h4>Қайталанған формулалар қорытындысы:</h4>
            <div className="breakdown-list">
              {sessionResults.mastered.map(item => (
                <div key={item.id} className="breakdown-row row-mastered">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span className="formula-name-text">{item.name}</span>
                  <span className="badge-mastered">Меңгерілді</span>
                </div>
              ))}
              {sessionResults.needsReview.map(item => (
                <div key={item.id} className="breakdown-row row-review">
                  <RotateCcw size={16} className="text-amber-400 shrink-0" />
                  <span className="formula-name-text">{item.name}</span>
                  <span className="badge-review">Жақында қайталау</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="summary-actions-row">
            <button
              className="btn btn-primary"
              onClick={() => startNewSession(selectedCategory, filterMode)}
            >
              <RotateCcw size={16} />
              <span>Жаңа жаттығу бастау</span>
            </button>

            {onBackToDashboard && (
              <button
                className="btn btn-secondary"
                onClick={onBackToDashboard}
              >
                <span>Басты бетке оралу</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-trainer-state">
          <BookOpen size={48} className="text-muted" />
          <h3>Таңдалған санат бойынша қайталайтын формулалар жоқ!</h3>
          <p>Барлық формулаларды қайталау режимін немесе басқа тақырыпты таңдаңыз.</p>
          <button
            className="btn btn-primary mt-4"
            onClick={() => {
              setSelectedCategory('all');
              setFilterMode('all');
            }}
          >
            Барлық формулаларды жүктеу
          </button>
        </div>
      )}
    </div>
  );
}


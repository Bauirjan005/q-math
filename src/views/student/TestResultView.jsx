import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowLeft, 
  Lightbulb, 
  Brain, 
  Target, 
  BookOpen, 
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import MathRenderer from '../../components/MathRenderer';

export default function TestResultView({ submission, test, onBackToDashboard, onRetake }) {
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'incorrect' | 'correct'
  const [recommendations, setRecommendations] = useState(null);
  const [expandedSolutions, setExpandedSolutions] = useState({});

  useEffect(() => {
    // Launch celebratory confetti if high score
    if (submission.percentage >= 70) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // Fetch AI personalized recommendations
    fetchRecommendations();
  }, [submission]);

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/api/student/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: submission.id,
          studentAnswers: submission.answers,
          testId: test.id
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error('Failed to load AI recommendations:', err);
    }
  };

  const toggleSolution = (qId) => {
    setExpandedSolutions(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const questions = test.questions || [];
  const results = submission.questionResults || {};

  const filteredQuestions = questions.filter(q => {
    const res = results[q.id];
    const isCorrect = res ? res.isCorrect : false;
    if (filterMode === 'incorrect') return !isCorrect;
    if (filterMode === 'correct') return isCorrect;
    return true;
  });

  const getGrantStatus = (pct) => {
    if (pct >= 90) return { label: '🎯 Мемлекеттік Грант (Жоғары нәтиже)', color: 'text-emerald-400' };
    if (pct >= 75) return { label: '⭐ Жақсы деңгей (Грантқа жақын)', color: 'text-blue-400' };
    if (pct >= 50) return { label: '⚠️ Шекті баллдан өтті (Дайындық қажет)', color: 'text-amber-400' };
    return { label: '❌ Қайталау қажет (Төмен балл)', color: 'text-rose-400' };
  };

  const grantStatus = getGrantStatus(submission.percentage);

  return (
    <div className="test-result-layout">
      {/* Top Navigation */}
      <div className="result-top-bar">
        <button className="btn-back" onClick={onBackToDashboard}>
          <ArrowLeft size={18} />
          <span>Оқушы кабинетіне оралу</span>
        </button>
        {onRetake && (
          <button className="btn btn-secondary btn-sm" onClick={onRetake}>
            <RotateCcw size={15} />
            <span>Тестті қайта тапсыру</span>
          </button>
        )}
      </div>

      {/* Main Score Hero Card */}
      <div className="score-hero-card">
        <div className="score-main-block">
          <div className="score-circle-wrapper">
            <svg className="score-svg" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" className="score-bg-circle" />
              <circle
                cx="60"
                cy="60"
                r="50"
                className="score-progress-circle"
                strokeDasharray={`${(submission.percentage / 100) * 314} 314`}
              />
            </svg>
            <div className="score-percentage-text">
              <span className="pct-num">{submission.percentage}%</span>
              <span className="pct-label">Дәлдік</span>
            </div>
          </div>

          <div className="score-details-text">
            <div className={`grant-status-badge ${grantStatus.color}`}>
              {grantStatus.label}
            </div>
            <h1 className="score-hero-title">
              {submission.totalScore} / {submission.maxScore} Ұпай
            </h1>
            <p className="score-hero-sub">
              Тест: <strong>{test.title}</strong> • Тапсырған: {submission.studentName}
            </p>
          </div>
        </div>

        <div className="score-kpi-summary">
          <div className="kpi-mini">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <div>
              <strong>{Object.values(results).filter(r => r.isCorrect).length}</strong>
              <span>Дұрыс жауап</span>
            </div>
          </div>
          <div className="kpi-mini">
            <XCircle size={18} className="text-rose-400" />
            <div>
              <strong>{Object.values(results).filter(r => !r.isCorrect).length}</strong>
              <span>Қате жауап</span>
            </div>
          </div>
          <div className="kpi-mini">
            <Clock size={18} className="text-purple-400" />
            <div>
              <strong>{Math.round(submission.durationSeconds / 60)} мин</strong>
              <span>Жұмсалған уақыт</span>
            </div>
          </div>
        </div>
      </div>

      {/* PERSONALIZED AI RECOMMENDATIONS & WEAK SPOT ANALYSIS */}
      {recommendations && (
        <div className="ai-diagnostic-card">
          <div className="diagnostic-header">
            <div className="diag-title-left">
              <div className="ai-glow-icon">
                <Brain size={22} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="diagnostic-title">AI Педагогикалық Диагностикасы & ҰБТ Жоспары</h3>
                <p className="diagnostic-sub">
                  Жасанды интеллект сіздің жауаптарыңызды талдап, әлсіз тақырыптар бойынша дайындық жоспарын жасады
                </p>
              </div>
            </div>
          </div>

          <div className="diagnostic-body">
            {recommendations.topWeaknesses && recommendations.topWeaknesses.length > 0 ? (
              <div className="weakness-alert-block">
                <div className="weakness-tag-title">
                  <Target size={16} className="text-amber-400" />
                  <span>Ерекше назар аударуды қажет ететін тақырыптар:</span>
                </div>
                <div className="weakness-tags-list">
                  {recommendations.topWeaknesses.map((w, idx) => (
                    <span key={idx} className="weakness-pill">
                      ⚠️ {w}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="perfect-score-banner">
                <Sparkles size={20} className="text-emerald-400" />
                <span>
                  Тамаша нәтиже! Сіз барлық сұрақтарды қатесіз шештіңіз. ҰБТ-да максималды балл жинауға толық мүмкіндігіңіз бар.
                </span>
              </div>
            )}

            {/* Study Plan Steps */}
            {recommendations.studyPlan && recommendations.studyPlan.length > 0 && (
              <div className="study-plan-steps">
                <div className="study-plan-heading">ҰБТ-ға дейінгі қадамдық жұмыс:</div>
                <div className="steps-container">
                  {recommendations.studyPlan.map((plan, i) => (
                    <div key={i} className="plan-step-card">
                      <div className="step-badge">Қадам #{plan.step}</div>
                      <div className="step-content">
                        <strong>{plan.focusArea}</strong>
                        <p>{plan.advice}</p>
                        <span className="step-drill-tag">📌 {plan.recommendedDrill}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPREHENSIVE QUESTION REVIEW SECTION */}
      <div className="review-section">
        <div className="review-section-header">
          <div className="review-title-wrap">
            <BookOpen size={20} className="text-emerald-400" />
            <h3 className="section-title">Сұрақтарды Толық Талдау (Review Mode)</h3>
          </div>

          {/* Filter tabs */}
          <div className="review-filters">
            <button
              className={`filter-btn ${filterMode === 'all' ? 'active' : ''}`}
              onClick={() => setFilterMode('all')}
            >
              Барлығы ({questions.length})
            </button>
            <button
              className={`filter-btn ${filterMode === 'incorrect' ? 'active' : ''}`}
              onClick={() => setFilterMode('incorrect')}
            >
              Қателер ({Object.values(results).filter(r => !r.isCorrect).length})
            </button>
            <button
              className={`filter-btn ${filterMode === 'correct' ? 'active' : ''}`}
              onClick={() => setFilterMode('correct')}
            >
              Дұрыс ({Object.values(results).filter(r => r.isCorrect).length})
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="review-questions-list">
          {filteredQuestions.map((q, idx) => {
            const res = results[q.id];
            const isCorrect = res ? res.isCorrect : false;
            const studentAns = res ? res.studentAnswer : null;
            const isExpanded = expandedSolutions[q.id] !== false; // default open

            return (
              <div
                key={q.id}
                className={`review-question-card ${isCorrect ? 'card-correct' : 'card-incorrect'}`}
              >
                <div className="review-card-top">
                  <div className="q-status-wrap">
                    <span className="q-index-pill">#{q.number || idx + 1}</span>
                    <span className={`status-pill ${isCorrect ? 'pill-success' : 'pill-danger'}`}>
                      {isCorrect ? '✓ Дұрыс шешілді (+1 ұпай)' : '✗ Қате жауап (0 ұпай)'}
                    </span>
                  </div>

                  <button
                    className="btn-toggle-solution"
                    onClick={() => toggleSolution(q.id)}
                  >
                    <span>{isExpanded ? 'Шешу жолын жасыру' : 'Шешу жолын көру'}</span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Question Statement */}
                <div className="review-q-text">
                  <MathRenderer text={q.question} />
                </div>

                {/* Options with Student Choice vs Correct Choice */}
                <div className="review-options-grid">
                  {q.options.map(opt => {
                    const isSelected = studentAns === opt.key;
                    const isOfficialCorrect = q.correctAnswer === opt.key;

                    let optClass = 'review-option-pill';
                    if (isOfficialCorrect) optClass += ' is-official-correct';
                    if (isSelected && !isOfficialCorrect) optClass += ' is-student-wrong';

                    return (
                      <div key={opt.key} className={optClass}>
                        <div className="opt-left">
                          <span className="opt-key">{opt.key}</span>
                          <span className="opt-text">
                            <MathRenderer text={opt.text} />
                          </span>
                        </div>

                        <div className="opt-tags">
                          {isOfficialCorrect && (
                            <span className="tag-correct-answer">✓ Дұрыс жауап</span>
                          )}
                          {isSelected && !isOfficialCorrect && (
                            <span className="tag-student-mistake">✗ Сіздің жауабыңыз</span>
                          )}
                          {isSelected && isOfficialCorrect && (
                            <span className="tag-student-match">✓ Сіздің жауабыңыз</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Expandable Pedagogical Deep-Dive */}
                {isExpanded && (
                  <div className="pedagogical-breakdown-box">
                    {/* Step-by-step LaTeX solution */}
                    <div className="pedagogy-section step-solution">
                      <div className="section-subtitle">
                        <BookOpen size={16} className="text-emerald-400" />
                        <span>Қадамдық шешу жолы (Step-by-step Solution):</span>
                      </div>
                      <div className="solution-latex-content">
                        <MathRenderer text={q.solution} />
                      </div>
                    </div>

                    {/* UNT Speed-Solving Trick (Лайфхак) */}
                    {q.speedTrick && (
                      <div className="pedagogy-section speed-trick-box">
                        <div className="section-subtitle">
                          <Lightbulb size={16} className="text-amber-400" />
                          <span>ҰБТ Экспресс-әдісі / Лайфхак (Speed-Solving Trick):</span>
                        </div>
                        <div className="trick-content">
                          <p>{q.speedTrick}</p>
                        </div>
                      </div>
                    )}

                    {/* Key Concept / Theorem */}
                    {q.keyConcept && (
                      <div className="pedagogy-section concept-box">
                        <div className="section-subtitle">
                          <Target size={16} className="text-blue-400" />
                          <span>Негізгі формула және анықтама (Key Concept):</span>
                        </div>
                        <div className="concept-content">
                          <p>{q.keyConcept}</p>
                        </div>
                      </div>
                    )}

                    {/* Common Pitfall / Misconception */}
                    {q.misconception && !isCorrect && (
                      <div className="pedagogy-section trap-box">
                        <div className="section-subtitle">
                          <XCircle size={16} className="text-rose-400" />
                          <span>Түсініспеушілік себебі (Misconception Trap):</span>
                        </div>
                        <div className="trap-content">
                          <p>{q.misconception}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

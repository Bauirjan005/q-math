import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  AlertTriangle, 
  Award, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  Flame,
  ChevronRight,
  X
} from 'lucide-react';
import MathRenderer from '../../components/MathRenderer';

export default function LiveAnalytics({ tests = [], initialTestId }) {
  const [selectedTestId, setSelectedTestId] = useState(initialTestId || (tests[0] && tests[0].id) || '');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHeatmapQuestion, setSelectedHeatmapQuestion] = useState(null);

  useEffect(() => {
    if (initialTestId) {
      setSelectedTestId(initialTestId);
    } else if (tests.length > 0 && !selectedTestId) {
      setSelectedTestId(tests[0].id);
    }
  }, [initialTestId, tests]);

  useEffect(() => {
    if (!selectedTestId) return;
    fetchAnalytics(selectedTestId);
  }, [selectedTestId]);

  const fetchAnalytics = async (testId) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/analytics/${testId}`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
        if (data.questionHeatmap && data.questionHeatmap.length > 0) {
          // Default select the most missed question for quick inspection
          const mostMissed = [...data.questionHeatmap].sort((a, b) => b.missPercentage - a.missPercentage)[0];
          setSelectedHeatmapQuestion(mostMissed);
        }
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getHeatmapColor = (missPct) => {
    if (missPct >= 60) return 'heat-critical'; // Red
    if (missPct >= 40) return 'heat-warning';  // Orange
    if (missPct >= 20) return 'heat-moderate'; // Yellow
    return 'heat-success';                     // Green
  };

  const getHeatmapLabel = (missPct) => {
    if (missPct >= 60) return 'Күрделі (Қате > 60%)';
    if (missPct >= 40) return 'Орташа қиын';
    if (missPct >= 20) return 'Қалыпты';
    return 'Жақсы меңгерілген';
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins} мин ${s} сек`;
  };

  if (!tests || tests.length === 0) {
    return (
      <div className="empty-analytics-state">
        <BarChart3 size={48} className="text-muted" />
        <h3>Әзірге тесттер жоқ</h3>
        <p>Аналитика мен жылу картасын (heatmap) көру үшін алдымен AI арқылы тест құрастырыңыз.</p>
      </div>
    );
  }

  return (
    <div className="live-analytics-container">
      {/* Top Test Selector & Refresh */}
      <div className="analytics-header">
        <div className="header-left">
          <h2 className="analytics-title">Тікелей Оқушылар Аналитикасы & Жылу Картасы (Heatmap)</h2>
          <p className="analytics-subtitle">
            Сынып нәтижелерін, ең көп қате жіберілген ҰБТ есептерін және типтік тұзақтарды бақылаңыз
          </p>
        </div>

        <div className="header-right">
          <label className="test-selector-label">Тестті таңдау:</label>
          <select
            className="analytics-test-select"
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
          >
            {tests.map(t => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.questions?.length || 0} сұрақ)
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="analytics-loading-box">
          <div className="step-dot-spinner" />
          <span>Аналитика деректері жүктелуде...</span>
        </div>
      ) : !analyticsData || analyticsData.totalSubmissions === 0 ? (
        <div className="empty-analytics-state">
          <Users size={44} className="text-muted" />
          <h3>Әзірге бұл тест бойынша тапсырыстар тіркелмеген</h3>
          <p>
            Оқушылар тестіні тапсырған бойда, олардың рейтингі, нәтижелері және жиі қателесетін сұрақтар картасы осында тікелей шығады.
          </p>
        </div>
      ) : (
        <>
          {/* Key Stat Cards */}
          <div className="stats-kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon-wrap icon-blue">
                <Users size={22} />
              </div>
              <div className="kpi-info">
                <div className="kpi-value">{analyticsData.totalSubmissions}</div>
                <div className="kpi-label">Тапсырған оқушылар</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap icon-emerald">
                <TrendingUp size={22} />
              </div>
              <div className="kpi-info">
                <div className="kpi-value">{analyticsData.averagePercentage}%</div>
                <div className="kpi-label">Сыныптың орташа балы</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap icon-amber">
                <Award size={22} />
              </div>
              <div className="kpi-info">
                <div className="kpi-value">
                  {analyticsData.averageScore} / {analyticsData.maxScorePossible}
                </div>
                <div className="kpi-label">Орташа жинаған ұпай</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrap icon-purple">
                <Clock size={22} />
              </div>
              <div className="kpi-info">
                <div className="kpi-value">
                  {analyticsData.rankings.length > 0
                    ? Math.round(
                        analyticsData.rankings.reduce((acc, r) => acc + r.durationSeconds, 0) /
                          analyticsData.rankings.length /
                          60
                      ) + ' мин'
                    : '—'}
                </div>
                <div className="kpi-label">Орташа жұмсалған уақыт</div>
              </div>
            </div>
          </div>

          {/* QUESTION MISS HEATMAP SECTION */}
          <div className="heatmap-section-card">
            <div className="section-title-wrap">
              <div className="title-left">
                <Flame size={20} className="text-amber-400" />
                <h3 className="section-title">Сұрақтар Қиындығының Жылу Картасы (Question Miss Heatmap)</h3>
              </div>
              <div className="heatmap-legend">
                <span className="legend-item"><span className="legend-dot heat-success" /> 0-20% (Оңай)</span>
                <span className="legend-item"><span className="legend-dot heat-moderate" /> 21-40% (Орташа)</span>
                <span className="legend-item"><span className="legend-dot heat-warning" /> 41-60% (Қиын)</span>
                <span className="legend-item"><span className="legend-dot heat-critical" /> &gt;60% (Өте қауіпті)</span>
              </div>
            </div>

            <div className="heatmap-grid-container">
              {analyticsData.questionHeatmap.map(q => {
                const colorClass = getHeatmapColor(q.missPercentage);
                const isSelected = selectedHeatmapQuestion && selectedHeatmapQuestion.questionId === q.questionId;

                return (
                  <button
                    key={q.questionId}
                    className={`heatmap-cell ${colorClass} ${isSelected ? 'cell-selected' : ''}`}
                    onClick={() => setSelectedHeatmapQuestion(q)}
                  >
                    <span className="cell-num">#{q.number}</span>
                    <span className="cell-pct">{q.missPercentage}% қате</span>
                    <span className="cell-count">{q.missCount}/{analyticsData.totalSubmissions}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Question Deep Inspector */}
            {selectedHeatmapQuestion && (
              <div className="heatmap-inspector-box">
                <div className="inspector-header">
                  <div className="inspector-title">
                    <span className="q-tag">Сұрақ #{selectedHeatmapQuestion.number} талдауы</span>
                    <span className={`status-badge-inline ${getHeatmapColor(selectedHeatmapQuestion.missPercentage)}`}>
                      {getHeatmapLabel(selectedHeatmapQuestion.missPercentage)} ({selectedHeatmapQuestion.missPercentage}% қате жіберілді)
                    </span>
                  </div>
                  <button className="btn-close-inspector" onClick={() => setSelectedHeatmapQuestion(null)}>
                    <X size={16} />
                  </button>
                </div>

                <div className="inspector-body">
                  <div className="inspector-q-text">
                    <MathRenderer text={selectedHeatmapQuestion.questionText} />
                  </div>

                  {/* Distractor Distribution Bars */}
                  <div className="distractor-analysis">
                    <div className="distractor-title">
                      Оқушылардың нұсқалар бойынша жауап бөлінісі (Distractor Analysis):
                    </div>
                    <div className="distractor-bars">
                      {['A', 'B', 'C', 'D', 'E'].map(optKey => {
                        const count = selectedHeatmapQuestion.distractorDistribution[optKey] || 0;
                        const pct = analyticsData.totalSubmissions > 0
                          ? Math.round((count / analyticsData.totalSubmissions) * 100)
                          : 0;
                        const isCorrect = optKey === selectedHeatmapQuestion.correctAnswer;

                        return (
                          <div key={optKey} className="distractor-bar-row">
                            <span className={`opt-circle ${isCorrect ? 'is-correct' : ''}`}>{optKey}</span>
                            <div className="bar-track">
                              <div
                                className={`bar-fill ${isCorrect ? 'fill-correct' : 'fill-wrong'}`}
                                style={{ width: `${Math.max(pct, 4)}%` }}
                              />
                            </div>
                            <span className="bar-stats">
                              {count} оқушы ({pct}%)
                              {isCorrect && <span className="label-correct">✓ Дұрыс</span>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Misconception Diagnostic */}
                  <div className="misconception-card">
                    <AlertTriangle size={18} className="text-amber-400" />
                    <div>
                      <strong>Типтік оқушы қателігі мен түсініспеушілік:</strong>
                      <p>{selectedHeatmapQuestion.commonMisconception}</p>
                    </div>
                  </div>

                  {/* Pedagogical Speed Trick */}
                  {selectedHeatmapQuestion.speedTrick && (
                    <div className="speed-trick-card">
                      <span className="trick-badge">ҰБТ Лайфхак</span>
                      <p>{selectedHeatmapQuestion.speedTrick}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CLASS RANKINGS LEADERBOARD */}
          <div className="rankings-section-card">
            <div className="section-title-wrap">
              <Award size={20} className="text-emerald-400" />
              <h3 className="section-title">Сынып Рейтингі (Class Rankings & Performance)</h3>
            </div>

            <div className="table-responsive">
              <table className="rankings-table">
                <thead>
                  <tr>
                    <th>Орын</th>
                    <th>Оқушының аты-жөні</th>
                    <th>Балл</th>
                    <th>Пайыз</th>
                    <th>Жұмсалған уақыт</th>
                    <th>Тапсырылған күні</th>
                    <th>Деңгейі</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.rankings.map(student => {
                    const isTop = student.rank === 1;
                    const isGrant = student.percentage >= 80;

                    return (
                      <tr key={student.submissionId} className={isTop ? 'row-top-rank' : ''}>
                        <td>
                          <span className={`rank-pill rank-${student.rank}`}>
                            {student.rank === 1 ? '🥇 #1' : student.rank === 2 ? '🥈 #2' : student.rank === 3 ? '🥉 #3' : `#${student.rank}`}
                          </span>
                        </td>
                        <td className="student-name-cell">
                          <strong>{student.studentName}</strong>
                        </td>
                        <td>
                          <span className="score-val">{student.totalScore}</span> / {student.maxScore}
                        </td>
                        <td>
                          <span className={`pct-badge ${student.percentage >= 80 ? 'pct-high' : student.percentage >= 50 ? 'pct-mid' : 'pct-low'}`}>
                            {student.percentage}%
                          </span>
                        </td>
                        <td>{formatSeconds(student.durationSeconds)}</td>
                        <td className="date-cell">
                          {new Date(student.submittedAt).toLocaleDateString('kk-KZ', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td>
                          <span className={`status-grant ${isGrant ? 'grant-eligible' : 'grant-need-work'}`}>
                            {isGrant ? '🎯 Грант деңгейі' : student.percentage >= 50 ? 'Шекті балл' : 'Қайталау қажет'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

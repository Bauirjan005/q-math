import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Trash2, 
  PlusCircle, 
  Send, 
  ArrowLeft, 
  AlertCircle, 
  Lightbulb, 
  Sparkles,
  Eye,
  Check
} from 'lucide-react';
import MathRenderer from '../../components/MathRenderer';

export default function TestEditor({ test, onUpdateTest, onPublishTest, onBack }) {
  const [questions, setQuestions] = useState(test.questions || []);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editedData, setEditedData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const startEdit = (q) => {
    setEditingQuestionId(q.id);
    setEditedData(JSON.parse(JSON.stringify(q)));
  };

  const cancelEdit = () => {
    setEditingQuestionId(null);
    setEditedData(null);
  };

  const saveEdit = () => {
    if (!editedData) return;
    const updated = questions.map(q => q.id === editedData.id ? { ...editedData, isApproved: true } : q);
    setQuestions(updated);
    onUpdateTest({ ...test, questions: updated });
    setEditingQuestionId(null);
    setEditedData(null);
  };

  const toggleApproval = (qId) => {
    const updated = questions.map(q => q.id === qId ? { ...q, isApproved: !q.isApproved } : q);
    setQuestions(updated);
    onUpdateTest({ ...test, questions: updated });
  };

  const approveAll = () => {
    const updated = questions.map(q => ({ ...q, isApproved: true }));
    setQuestions(updated);
    onUpdateTest({ ...test, questions: updated });
  };

  const deleteQuestion = (qId) => {
    if (questions.length <= 1) {
      alert('Тестте кемінде 1 сұрақ қалуы керек!');
      return;
    }
    const updated = questions.filter(q => q.id !== qId).map((q, idx) => ({ ...q, number: idx + 1 }));
    setQuestions(updated);
    onUpdateTest({ ...test, questions: updated });
  };

  const addNewQuestion = () => {
    const newQ = {
      id: 'q_custom_' + Date.now(),
      number: questions.length + 1,
      type: 'single',
      points: 1,
      question: 'Жаңа математикалық сұрақ: $f(x) = ...$',
      options: [
        { key: 'A', text: '$1$' },
        { key: 'B', text: '$2$' },
        { key: 'C', text: '$3$' },
        { key: 'D', text: '$4$' },
        { key: 'E', text: '$0$' }
      ],
      correctAnswer: 'A',
      solution: 'Шешу жолы: формулалар мен түрлендірулерді қадам бойынша орындаңыз.',
      keyConcept: 'Негізгі формула немесе теорема',
      speedTrick: 'ҰБТ Лайфхак: Тест нұсқасын қойып тексеру',
      misconception: 'Типтік қателік',
      isApproved: false
    };

    const updated = [...questions, newQ];
    setQuestions(updated);
    onUpdateTest({ ...test, questions: updated });
    startEdit(newQ);
  };

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      await onPublishTest(test.id);
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 3000);
    } catch (err) {
      alert('Жариялау сәтсіз аяқталды: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const approvedCount = questions.filter(q => q.isApproved).length;
  const isAllApproved = approvedCount === questions.length;

  return (
    <div className="test-editor-container">
      {/* Top action header */}
      <div className="editor-top-bar">
        <div className="bar-left">
          <button className="btn-back" onClick={onBack}>
            <ArrowLeft size={18} />
            <span>Артқа қайту</span>
          </button>
          <div className="editor-title-wrap">
            <h2 className="editor-title">{test.title}</h2>
            <div className="editor-meta-tags">
              <span className="badge badge-topic">{test.topicName}</span>
              <span className="badge badge-diff">{test.difficultyLabel}</span>
              <span className="badge badge-time">
                <Clock size={13} /> {test.durationMinutes} мин
              </span>
              <span className={`badge ${test.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                {test.status === 'published' ? 'Жарияланған (Published)' : 'Тексеруде (Draft Review)'}
              </span>
            </div>
          </div>
        </div>

        <div className="bar-right">
          <button className="btn btn-secondary" onClick={approveAll}>
            <CheckCircle2 size={16} />
            <span>Барлығын растау ({approvedCount}/{questions.length})</span>
          </button>

          <button className="btn btn-secondary" onClick={addNewQuestion}>
            <PlusCircle size={16} />
            <span>Сұрақ қосу</span>
          </button>

          <button
            className={`btn btn-primary ${publishSuccess ? 'btn-success-burst' : ''}`}
            onClick={handlePublish}
            disabled={isSaving}
          >
            {publishSuccess ? (
              <>
                <Check size={16} />
                <span>Оқушыларға Жарияланды!</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Оқушыларға Жариялау (Publish)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {publishSuccess && (
        <div className="alert-published-banner">
          🎉 Тест сәтті бекітілді және барлық оқушылар үшін ашылды! Оқушылар енді тест тапсыра алады.
        </div>
      )}

      {/* Question List */}
      <div className="questions-editor-list">
        {questions.map((q, index) => {
          const isEditing = editingQuestionId === q.id;

          return (
            <div
              key={q.id}
              className={`question-edit-card ${q.isApproved ? 'is-approved' : 'is-draft'} ${isEditing ? 'is-currently-editing' : ''}`}
            >
              {isEditing ? (
                /* EDIT FORM */
                <div className="edit-form-wrap">
                  <div className="form-header">
                    <span className="edit-badge">Сұрақ #{index + 1} Өңдеу (LaTeX қолдауымен)</span>
                    <div className="form-actions">
                      <button className="btn btn-sm btn-secondary" onClick={cancelEdit}>
                        Бас тарту
                      </button>
                      <button className="btn btn-sm btn-primary" onClick={saveEdit}>
                        Сақтау & Бекіту
                      </button>
                    </div>
                  </div>

                  {/* Question Text with KaTeX Preview */}
                  <div className="form-group">
                    <label>Сұрақ мәтіні (LaTeX формулаларын $...$ ішіне жазыңыз):</label>
                    <textarea
                      className="input-textarea"
                      rows={3}
                      value={editedData.question}
                      onChange={e => setEditedData({ ...editedData, question: e.target.value })}
                    />
                    <div className="live-preview-box">
                      <span className="preview-label">Алдын ала көрініс (Live KaTeX Preview):</span>
                      <div className="preview-content">
                        <MathRenderer text={editedData.question} />
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="form-group">
                    <label>Жауап нұсқалары (Дұрыс жауапты белгілеңіз):</label>
                    <div className="options-edit-grid">
                      {editedData.options.map((opt, optIdx) => (
                        <div key={opt.key} className="option-edit-row">
                          <label className="radio-label">
                            <input
                              type="radio"
                              name={`correct_${q.id}`}
                              checked={editedData.correctAnswer === opt.key}
                              onChange={() => setEditedData({ ...editedData, correctAnswer: opt.key })}
                            />
                            <span className="opt-key-circle">{opt.key}</span>
                          </label>
                          <input
                            type="text"
                            className="input-opt-text"
                            value={opt.text}
                            onChange={e => {
                              const newOpts = [...editedData.options];
                              newOpts[optIdx].text = e.target.value;
                              setEditedData({ ...editedData, options: newOpts });
                            }}
                          />
                          <div className="opt-inline-preview">
                            <MathRenderer text={opt.text} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Solution & Pedagogical notes */}
                  <div className="form-row-duo">
                    <div className="form-group">
                      <label>Қадамдық шешу жолы (Step-by-step Solution):</label>
                      <textarea
                        className="input-textarea"
                        rows={3}
                        value={editedData.solution}
                        onChange={e => setEditedData({ ...editedData, solution: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>ҰБТ Экспресс-әдісі / Лайфхак (Speed-Solving Trick):</label>
                      <textarea
                        className="input-textarea"
                        rows={3}
                        value={editedData.speedTrick}
                        onChange={e => setEditedData({ ...editedData, speedTrick: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* READ / PREVIEW CARD */
                <div className="card-view-wrap">
                  <div className="card-top">
                    <div className="q-number-pill">
                      <span className="num">#{index + 1}</span>
                      <span className="pts">{q.points || 1} ұпай</span>
                      <span className={`status-pill ${q.isApproved ? 'status-approved' : 'status-pending'}`}>
                        {q.isApproved ? '✓ Мақұлданған (Approved)' : 'Тексеру қажет'}
                      </span>
                    </div>

                    <div className="card-actions">
                      <button
                        className={`btn-approval-toggle ${q.isApproved ? 'active' : ''}`}
                        onClick={() => toggleApproval(q.id)}
                        title={q.isApproved ? 'Мақұлдауды алып тастау' : 'Сұрақты мақұлдау'}
                      >
                        <CheckCircle2 size={16} />
                        <span>{q.isApproved ? 'Мақұлданды' : 'Мақұлдау'}</span>
                      </button>

                      <button
                        className="btn-icon"
                        onClick={() => startEdit(q)}
                        title="Сұрақты өңдеу"
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        className="btn-icon btn-danger"
                        onClick={() => deleteQuestion(q.id)}
                        title="Сұрақты өшіру"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Question Statement */}
                  <div className="question-statement">
                    <MathRenderer text={q.question} />
                  </div>

                  {/* Options */}
                  <div className="options-display-grid">
                    {q.options.map(opt => {
                      const isCorrect = opt.key === q.correctAnswer;
                      return (
                        <div
                          key={opt.key}
                          className={`option-badge-item ${isCorrect ? 'correct-option' : ''}`}
                        >
                          <span className="opt-letter">{opt.key}</span>
                          <span className="opt-text">
                            <MathRenderer text={opt.text} />
                          </span>
                          {isCorrect && <span className="correct-tag">Дұрыс жауап</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pedagogical Collapsible Preview */}
                  <div className="pedagogy-details">
                    <div className="solution-snippet">
                      <strong>Шешу жолы: </strong>
                      <MathRenderer text={q.solution} />
                    </div>

                    {q.speedTrick && (
                      <div className="trick-snippet">
                        <Lightbulb size={15} className="text-amber-400" />
                        <div>
                          <strong>{q.speedTrick}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

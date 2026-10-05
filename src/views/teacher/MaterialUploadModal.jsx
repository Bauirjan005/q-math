import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  HelpCircle,
  FileCheck,
  Cpu,
  ArrowRight,
  BookOpen
} from 'lucide-react';

const TOPIC_PRESETS = [
  {
    id: 'calculus_algebra',
    name: 'Алгебра және Анализ бастамалары',
    desc: 'Туынды, интеграл, көрсеткіштік және логарифмдік функциялар, теңдеулер',
    sampleText: '11-сынып Алгебра: Функцияның туындысы және оның геометриялық, физикалық мағынасы. Дәрежелік функцияны дифференциалдау: (x^n)\' = n*x^(n-1). Ньютон-Лейбниц формуласы және аудандарды интеграл арқылы есептеу.'
  },
  {
    id: 'trigonometry',
    name: 'Тригонометрия',
    desc: 'Қос бұрыш, дәрежені төмендету, негізгі тепе-теңдіктер және теңдеулер',
    sampleText: 'Тригонометрия бөлімі: sin^2(x) + cos^2(x) = 1. Қос бұрыш формулалары: sin(2x) = 2sin(x)cos(x), cos(2x) = cos^2(x) - sin^2(x). Тригонометриялық теңдеулерді шешу және ширектердегі таңбаларды анықтау.'
  },
  {
    id: 'geometry_stereometry',
    name: 'Геометрия және Стереометрия',
    desc: 'Тік призма, пирамида, цилиндр, конус көлемдері, векторлар',
    sampleText: 'Стереометрия: Кеңістіктегі денелер. Тік төртбұрышты призма және дұрыс пирамида көлемі V = (1/3)*S_таб*H. Векторлардың скалярлық көбейтіндісі: a*b = x1*x2 + y1*y2 + z1*z2 = 0 болса, векторлар өзара перпендикуляр.'
  },
  {
    id: 'math_literacy',
    name: 'Математикалық сауаттылық',
    desc: 'Логика, сандық заңдылықтар, пайыздар, диаграммалар, уақыт пен жылдамдық',
    sampleText: 'Математикалық сауаттылық: Күрделі пайыздар, тауар бағасының өзгеруі, реттік заңдылықтарды анықтау, фигуралардың ауданы және комбинирленген логикалық есептер.'
  },
  {
    id: 'probability_combinatorics',
    name: 'Ықтималдықтар және Комбинаторика',
    desc: 'Орын алмастыру, орналастыру, теру, кездейсоқ оқиғалар ықтималдығы',
    sampleText: 'Комбинаторика және классикалық ықтималдық: P(A) = m/n. Теру формуласы C_n^k = n! / (k!*(n-k)!). Оқиғалардың ықтималдығын есептеу есептері.'
  }
];

export default function MaterialUploadModal({ isOpen, onClose, onTestGenerated }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'text'
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [customText, setCustomText] = useState('');
  const [topic, setTopic] = useState('calculus_algebra');
  const [difficulty, setDifficulty] = useState('standard');
  const [questionCount, setQuestionCount] = useState(5);
  const [language, setLanguage] = useState('kz');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    setSelectedFile(file);
    setErrorMsg('');
    // Create preview or info
    setFilePreview({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type || file.name.split('.').pop().toUpperCase()
    });
  };

  const handleApplyPreset = (preset) => {
    setTopic(preset.id);
    setCustomText(preset.sampleText);
    setActiveTab('text');
  };

  const handleStartGeneration = async () => {
    setErrorMsg('');
    setIsGenerating(true);
    setGenerationStep(1);

    try {
      let extractedContent = customText;
      const teacherToken = localStorage.getItem('teacher_token') || 'teacher_tok_default';

      // 1. If file uploaded, send to upload endpoint
      if (activeTab === 'upload' && selectedFile) {
        setGenerationStep(1); // Document Parsing
        const formData = new FormData();
        formData.append('material', selectedFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${teacherToken}` },
          body: formData
        });

        if (!uploadRes.ok) {
          throw new Error('Құжатты жүктеу немесе талдау кезінде қате орын алды');
        }

        const uploadData = await uploadRes.json();
        extractedContent = uploadData.extractedContent;
      }

      // Step 2: Theorem extraction
      setGenerationStep(2);
      await new Promise(r => setTimeout(r, 600));

      // Step 3: Distractor & LaTeX generation
      setGenerationStep(3);
      await new Promise(r => setTimeout(r, 600));

      // Step 4: Speed tricks & step solutions
      setGenerationStep(4);

      const topicObj = TOPIC_PRESETS.find(t => t.id === topic);
      const testTitle = `ҰБТ 2026: ${topicObj ? topicObj.name : 'Математика'} (${questionCount} сұрақ)`;

      // Step 5: Call generate API
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          topic,
          difficulty,
          questionCount: parseInt(questionCount),
          language,
          materialText: extractedContent,
          title: testTitle
        })
      });

      if (!genRes.ok) {
        throw new Error('AI тест генерациясы кезінде қате болды');
      }

      const genData = await genRes.json();
      setGenerationStep(5);
      await new Promise(r => setTimeout(r, 400));

      setIsGenerating(false);
      onTestGenerated(genData.test);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Генерация барысында белгісіз қате шықты');
      setIsGenerating(false);
    }
  };

  const stepsList = [
    'Оқу материалын жүктеу және мәтінді талдау (Document Parsing)',
    'Негізгі теоремалар мен формулаларды анықтау (Curriculum Extraction)',
    'ҰБТ форматындағы сұрақтар мен дистракторларды құру (Distractor Modeling)',
    'LaTeX қадамдық шешулер мен экспресс-әдістерді синтездеу (LaTeX & Speed Tricks)',
    'JSON құрылымына жинақтау және стандарттарға тексеру (Validation)'
  ];

  return (
    <div className="modal-overlay" onClick={() => !isGenerating && onClose()}>
      <div className="modal-card generate-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="ai-icon-pulse">
              <Sparkles size={22} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="modal-title">AI ҰБТ Тест Генераторы</h2>
              <p className="modal-subtitle">
                Оқу материалдарын жүктеп, ҰБТ стандартына сай LaTeX математикалық тапсырмаларын құрыңыз
              </p>
            </div>
          </div>
          {!isGenerating && (
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>

        {isGenerating ? (
          <div className="generation-progress-view">
            <div className="ai-spinner-container">
              <div className="pulsing-orbit">
                <div className="orbit-core">∑</div>
              </div>
              <h3 className="progress-title">AI Математикалық Есептерді Құрастыруда...</h3>
              <p className="progress-sub">ҰБТ спецификациясы, LaTeX формулалары және типтік дистракторлар есептелуде</p>
            </div>

            <div className="progress-steps-list">
              {stepsList.map((step, idx) => {
                const stepNum = idx + 1;
                const isDone = generationStep > stepNum;
                const isCurrent = generationStep === stepNum;
                return (
                  <div
                    key={idx}
                    className={`step-item ${isDone ? 'step-done' : ''} ${isCurrent ? 'step-current' : ''}`}
                  >
                    <div className="step-icon">
                      {isDone ? (
                        <CheckCircle2 size={18} className="text-emerald-400" />
                      ) : isCurrent ? (
                        <div className="step-dot-spinner" />
                      ) : (
                        <div className="step-dot-idle" />
                      )}
                    </div>
                    <span className="step-text">{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="modal-body">
            {errorMsg && (
              <div className="alert-error">
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Input Mode Tabs */}
            <div className="input-mode-tabs">
              <button
                className={`mode-tab ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveTab('upload')}
              >
                <Upload size={16} />
                <span>Файл жүктеу (PDF, DOCX, Сурет)</span>
              </button>
              <button
                className={`mode-tab ${activeTab === 'text' ? 'active' : ''}`}
                onClick={() => setActiveTab('text')}
              >
                <FileText size={16} />
                <span>Оқу бағдарламасы / Мәтін жазу</span>
              </button>
            </div>

            {/* Upload Area */}
            {activeTab === 'upload' ? (
              <div
                className="dropzone-area"
                onDragOver={e => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                  onChange={e => e.target.files[0] && handleFileSelected(e.target.files[0])}
                />
                <div className="dropzone-content">
                  <div className="dropzone-icon">
                    <Upload size={32} />
                  </div>
                  {selectedFile ? (
                    <div className="file-info-badge">
                      <FileCheck size={20} className="text-emerald-400" />
                      <div>
                        <strong>{filePreview.name}</strong>
                        <span>({filePreview.size} • {filePreview.type})</span>
                      </div>
                      <button
                        className="btn-remove-file"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setFilePreview(null);
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="dropzone-main-text">
                        Файлды осы жерге тастаңыз немесе <span>таңдау үшін басыңыз</span>
                      </div>
                      <div className="dropzone-sub-text">
                        Қолдау көрсетілетін пішімдер: PDF, DOCX, TXT, сканерленген тест суреттері (PNG, JPG)
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-input-area">
                <textarea
                  className="syllabus-textarea"
                  placeholder="Оқу тақырыбын, есептер жинағының үзіндісін немесе формулаларды енгізіңіз..."
                  rows={4}
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                />
              </div>
            )}

            {/* Presets quick picks */}
            <div className="preset-quick-picks">
              <span className="preset-label">Дайын ҰБТ тақырыптары:</span>
              <div className="preset-tags">
                {TOPIC_PRESETS.map(p => (
                  <button
                    key={p.id}
                    className={`preset-btn ${topic === p.id ? 'active' : ''}`}
                    onClick={() => handleApplyPreset(p)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Customizable Parameters */}
            <div className="parameters-grid">
              <div className="param-group">
                <label className="param-label">Математикалық Бөлім (Topic)</label>
                <select
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="param-select"
                >
                  {TOPIC_PRESETS.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="param-group">
                <label className="param-label">Күрделілік Деңгейі (Difficulty)</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="param-select"
                >
                  <option value="base">Базалық деңгей (1-10 сұрақтар)</option>
                  <option value="standard">Стандартты ҰБТ деңгейі (11-25 сұрақтар)</option>
                  <option value="advanced">Бейіндік / Жоғары деңгей (26-35 сұрақтар)</option>
                </select>
              </div>

              <div className="param-group">
                <label className="param-label">Сұрақтар Саны (Questions)</label>
                <select
                  value={questionCount}
                  onChange={e => setQuestionCount(e.target.value)}
                  className="param-select"
                >
                  <option value="5">5 сұрақ (Экспресс бағалау)</option>
                  <option value="10">10 сұрақ (Шағын сынақ)</option>
                  <option value="15">15 сұрақ (Тақырыптық бақылау)</option>
                  <option value="20">20 сұрақ (Жартылай тест)</option>
                  <option value="35">35 сұрақ (Толық ҰБТ стандарты)</option>
                </select>
              </div>

              <div className="param-group">
                <label className="param-label">Тіл (Language)</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="param-select"
                >
                  <option value="kz">Қазақ тілі (ҚазҰБТ)</option>
                  <option value="ru">Орыс тілі (РусЕНТ)</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>
                Бас тарту
              </button>
              <button
                className="btn btn-primary btn-generate-submit"
                onClick={handleStartGeneration}
              >
                <Sparkles size={17} />
                <span>AI Тест Құрастыру (Generate)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

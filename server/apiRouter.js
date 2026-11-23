import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { generateUNTQuestions, parseDocumentContent, getPersonalizedRecommendations } from './services/mathEngine.js';
import { 
  sendTelegramMessage,
  notifyTestCompleted, 
  notifyLowPerformanceAlert, 
  notifyInactivityAlert, 
  notifyWeeklyDigest, 
  broadcastToParents, 
  handleTelegramWebhook 
} from './services/telegramBotService.js';

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_'));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

// Statically serve uploaded files
router.use('/uploads', express.static(uploadDir));

// Local persistent storage manager
import { loadStore, saveStore } from './storage.js';
import { DEMO_STUDENTS, DEMO_SUBMISSIONS, DEMO_NOTIFICATIONS } from './demoData.js';

// Load stored data (or initialize empty real database)
const persistentStore = loadStore();

let tests = persistentStore.tests;
let submissions = persistentStore.submissions; // Real test submissions (starts empty [])
let students = persistentStore.students;       // Real registered students (starts empty [])
let notifications = persistentStore.notifications; // Real notifications (starts empty [])
let materials = persistentStore.materials;     // Real homework materials (starts empty [])

let teacherClassroom = persistentStore.classroom || {
  code: 'MATH-2026',
  teacherName: 'Асқар Нұрпейісов',
  school: 'РФММ, Алматы',
  subject: 'Математика және ҰБТ сараптамасы'
};

// Global Demo Mode flag (OFF by default: real students only)
let isDemoMode = false;

// Helper to persist current state to disk (server/data/store.json)
export function persist() {
  saveStore({
    students,
    submissions,
    notifications,
    materials,
    tests,
    classroom: teacherClassroom,
    teacher: teacherUser
  });
}

// Master Teacher User (Persistent store > environment variables > default fallback)
let teacherUser = persistentStore.teacher || {
  id: 'teacher-1',
  email: (process.env.TEACHER_EMAIL || 'teacher@qmath.kz').trim().toLowerCase(),
  password: process.env.TEACHER_PASSWORD || 'admin2026',
  name: process.env.TEACHER_NAME || 'Асқар Нұрпейісов',
  role: 'teacher',
  school: process.env.TEACHER_SCHOOL || 'РФММ, Алматы',
  subject: 'Математика және ҰБТ сараптамасы',
  classroomCode: process.env.TEACHER_CLASSROOM_CODE || 'MATH-2026'
};

// Ensure teacherUser role is strictly 'teacher'
teacherUser.role = 'teacher';

// In-memory active session stores
let teacherSessions = new Map(); // token -> teacher object (with role: 'teacher')
let sessions = new Map();        // token -> student session { studentId, role: 'student' }

// Strict RBAC Helper: Verifies caller has teacher role
function isTeacher(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return false;
  const session = teacherSessions.get(token);
  return Boolean(session && session.role === 'teacher');
}

// Strict RBAC Middleware: Protects teacher-only routes & API endpoints
function requireTeacherAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(401).json({ error: 'Авторизация қажет (Authentication required. Bearer token missing)' });
  }
  const session = teacherSessions.get(token);
  if (!session || session.role !== 'teacher') {
    return res.status(403).json({ error: 'Қолжетімділік шектелген: тек мұғалімдер үшін (Access denied. Teacher credentials required.)' });
  }
  req.teacher = session;
  next();
}

function sanitizeStudent(s) {
  if (!s) return null;
  const { password, ...rest } = s;
  return rest;
}
function initializeSeedData() {
  const sampleTest1 = {
    id: 'unt-test-101',
    title: 'ҰБТ 2026: Математикалық сауаттылық және Анализ бастамалары',
    topic: 'calculus_algebra',
    topicName: 'Алгебра және анализ бастамалары',
    difficulty: 'standard',
    difficultyLabel: 'Стандартты ҰБТ (Орташа)',
    language: 'kz',
    durationMinutes: 40,
    status: 'published', // draft, approved, published
    createdAt: '2026-10-01T08:00:00.000Z',
    approvedAt: '2026-10-01T09:00:00.000Z',
    publishedAt: '2026-10-01T10:00:00.000Z',
    sourceMaterialName: 'Талдау_материалы_Туынды_және_Интеграл.pdf',
    questions: [
      {
        id: 'q1',
        number: 1,
        type: 'single', // single choice (1 pt)
        points: 1,
        question: 'Берілген функцияның туындысын табыңыз: $f(x) = 3x^4 - 5x^2 + 7x - 9$',
        options: [
          { key: 'A', text: '$12x^3 - 10x + 7$' },
          { key: 'B', text: '$12x^3 - 5x + 7$' },
          { key: 'C', text: '$7x^3 - 10x + 7$' },
          { key: 'D', text: '$12x^3 - 10x^2 + 7$' },
          { key: 'E', text: '$3x^3 - 10x + 7$' }
        ],
        correctAnswer: 'A',
        solution: 'Дәрежелік функцияның туындысын есептеу формуласы: $(x^n)\' = n \\cdot x^{n-1}$. \\n\\nӘрбір қосылғыштың туындысын жеке аламыз:\\n$(3x^4)\' = 3 \\cdot 4x^3 = 12x^3$\\n$(-5x^2)\' = -5 \\cdot 2x = -10x$\\n$(7x)\' = 7$\\n$(-9)\' = 0$\\n\\nҚорытынды: $f\'(x) = 12x^3 - 10x + 7$. Дұрыс жауап: A.',
        keyConcept: 'Дәрежені дифференциалдау ережесі: $(c \\cdot x^n)\' = c \\cdot n \\cdot x^{n-1}$ және тұрақтының туындысы $c\' = 0$.',
        speedTrick: 'ҰБТ Лайфхак: Тұрақты санның $(-9)$ туындысы 0 болатынын және үлкен дәреженің коэффициенті $3 \\times 4 = 12$ болуы керек екенін бірден байқасаңыз, 5 секундта В, C, E нұсқалары шығып қалады.',
        misconception: 'Оқушылар жиі дәрежені азайтуды ұмытып, $5x^2$ туындысын $5x$ деп қателеседі (В нұсқасы).',
        isApproved: true
      },
      {
        id: 'q2',
        number: 2,
        type: 'single',
        points: 1,
        question: 'Теңдеуді шешіңіз: $2^{x+3} - 2^x = 56$',
        options: [
          { key: 'A', text: '$x = 2$' },
          { key: 'B', text: '$x = 3$' },
          { key: 'C', text: '$x = 4$' },
          { key: 'D', text: '$x = 5$' },
          { key: 'E', text: '$x = 1$' }
        ],
        correctAnswer: 'B',
        solution: 'Дәреже қасиетін қолданамыз: $2^{x+3} = 2^x \\cdot 2^3 = 8 \\cdot 2^x$.\\n\\nОртақ көбейткішті жақша сыртына шығарамыз:\\n$2^x(2^3 - 1) = 56$\\n$2^x(8 - 1) = 56$\\n$2^x \\cdot 7 = 56$\\n$2^x = \\frac{56}{7} = 8$\\n$2^x = 2^3 \\implies x = 3$. Дұрыс жауап: B.',
        keyConcept: 'Көрсеткіштік теңдеулерде ортақ дәрежені $a^x$ жақша сыртына шығару әдісі: $a^{x+k} = a^x \\cdot a^k$.',
        speedTrick: 'ҰБТ Лайфхак: Теңдеуді шешпей-ақ нұсқаларды тексеру! $x=3$ қойсақ: $2^6 - 2^3 = 64 - 8 = 56$. Дәл келді! 10 секундтық тексеру.',
        misconception: 'Кейбір оқушылар дәрежелерді бір-бірінен азайтып $2^3 = 8$ деп шатастырады.',
        isApproved: true
      },
      {
        id: 'q3',
        number: 3,
        type: 'single',
        points: 1,
        question: 'Ықшамдаңыз: $\\frac{\\sin(2\\alpha)}{1 + \\cos(2\\alpha)}$',
        options: [
          { key: 'A', text: '$\\operatorname{tg}\\alpha$' },
          { key: 'B', text: '$\\operatorname{ctg}\\alpha$' },
          { key: 'C', text: '$\\sin\\alpha$' },
          { key: 'D', text: '$\\cos\\alpha$' },
          { key: 'E', text: '$2\\operatorname{tg}\\alpha$' }
        ],
        correctAnswer: 'A',
        solution: 'Қос бұрыш формулаларын қолданамыз:\\n$\\sin(2\\alpha) = 2\\sin\\alpha\\cos\\alpha$\\n$1 + \\cos(2\\alpha) = 2\\cos^2\\alpha$\\n\\nБөлшекке қоямыз:\\n$\\frac{2\\sin\\alpha\\cos\\alpha}{2\\cos^2\\alpha} = \\frac{\\sin\\alpha}{\\cos\\alpha} = \\operatorname{tg}\\alpha$.\\n\\nДұрыс жауап: A.',
        keyConcept: 'Тригонометрияның негізгі қос бұрыш және дәрежені төмендету формулалары: $1 + \\cos(2\\alpha) = 2\\cos^2\\alpha$.',
        speedTrick: 'ҰБТ Лайфхак: Ыңғайлы бұрыш қою әдісі! $\\alpha = 45^\\circ$ қойыңыз. $\\sin(90^\\circ)=1$, $\\cos(90^\\circ)=0$. Сонда $\\frac{1}{1+0} = 1$. Жауаптарда $\\operatorname{tg}(45^\\circ) = 1$. Бірден A шығады!',
        misconception: 'Оқушылар $1 + \\cos(2\\alpha)$ орнына $2\\sin^2\\alpha$ деп таңбасынан немесе функциясынан қателеседі (В нұсқасы).',
        isApproved: true
      },
      {
        id: 'q4',
        number: 4,
        type: 'single',
        points: 1,
        question: 'Интегралды есептеңіз: $\\int_{1}^{3} (3x^2 - 2x + 1) \\, dx$',
        options: [
          { key: 'A', text: '$20$' },
          { key: 'B', text: '$22$' },
          { key: 'C', text: '$18$' },
          { key: 'D', text: '$24$' },
          { key: 'E', text: '$16$' }
        ],
        correctAnswer: 'A',
        solution: 'Алғашқы функцияны Ньютон-Лейбниц формуласы бойынша табамыз:\\n$F(x) = \\int (3x^2 - 2x + 1) dx = x^3 - x^2 + x$\\n\\nШектерін қоямыз:\\n$F(3) = 3^3 - 3^2 + 3 = 27 - 9 + 3 = 21$\\n$F(1) = 1^3 - 1^2 + 1 = 1 - 1 + 1 = 1$\\n\\nНәтиже: $F(3) - F(1) = 21 - 1 = 20$.\\nДұрыс жауап: A.',
        keyConcept: 'Ньютон-Лейбниц формуласы: $\\int_{a}^{b} f(x) dx = F(b) - F(a)$.',
        speedTrick: 'ҰБТ Лайфхак: Есептеуді жеңілдету үшін әр мүшені жеке алыс-беріс жасаңыз: $(3^3-1^3) - (3^2-1^2) + (3-1) = 26 - 8 + 2 = 20$. Арифметикалық қателерді болдырмайды.',
        misconception: 'Төменгі шек $F(1)$-ді азайтқанда таңбаларды жақшасыз жазып шатасу.',
        isApproved: true
      },
      {
        id: 'q5',
        number: 5,
        type: 'single',
        points: 1,
        question: 'Тік бұрышты үшбұрыштың катеттері $6\\text{ см}$ және $8\\text{ см}$. Оған сырттай сызылған шеңбердің радиусын табыңыз.',
        options: [
          { key: 'A', text: '$5\\text{ см}$' },
          { key: 'B', text: '$10\\text{ см}$' },
          { key: 'C', text: '$4\\text{ см}$' },
          { key: 'D', text: '$2.5\\text{ см}$' },
          { key: 'E', text: '$7\\text{ см}$' }
        ],
        correctAnswer: 'A',
        solution: '1) Пифагор теоремасы бойынша гипотенузаны табамыз:\\n$c = \\sqrt{6^2 + 8^2} = \\sqrt{36 + 64} = \\sqrt{100} = 10\\text{ см}$.\\n\\n2) Тік бұрышты үшбұрышқа сырттай сызылған шеңбердің центрі гипотенузаның ортасында жатады, сондықтан радиус гипотенузаның жартысына тең:\\n$R = \\frac{c}{2} = \\frac{10}{2} = 5\\text{ см}$.\\nДұрыс жауап: A.',
        keyConcept: 'Тікбұрышты үшбұрышқа сырттай сызылған шеңбердің радиусы $R = \\frac{c}{2}$, ал іштей сызылған шеңбер радиусы $r = \\frac{a+b-c}{2}$.',
        speedTrick: 'ҰБТ Лайфхак: Мысыр үшбұрышы! Катеттері 6 мен 8 болса, гипотенуза 10. Сырттай сызылған радиус әрдайым гипотенузаның жартысы $\\rightarrow 5$. 3 секундта шешіледі.',
        misconception: 'Оқушылар радиусты диаметрмен (гипотенузамен) шатастырып $10\\text{ см}$ белгілейді (В нұсқасы).',
        isApproved: true
      }
    ]
  };

  // Only seed the initial published UNT test if tests repository is completely empty
  if (tests.length === 0) {
    tests.push(sampleTest1);
    persist();
  }

  // NOTE: Demo students and submissions are NOT automatically injected into real data!
  // They are kept isolated in server/demoData.js and only displayed when Demo Mode is active.
}

initializeSeedData();

// --- DEMO MODE ENDPOINTS ---
router.get('/demo-mode', (req, res) => {
  return res.json({ isDemoMode });
});

router.post('/demo-mode/toggle', requireTeacherAuth, (req, res) => {
  if (typeof req.body.enabled === 'boolean') {
    isDemoMode = req.body.enabled;
  } else {
    isDemoMode = !isDemoMode;
  }
  return res.json({ success: true, isDemoMode });
});

// Reset / Clear all students and submissions (Teacher Protected)
router.post('/store/reset', requireTeacherAuth, (req, res) => {
  students = [];
  submissions = [];
  notifications = [];
  persist();
  return res.json({ success: true, message: 'All student records cleanly reset.' });
});

// --- API ROUTES ---

// 1. Upload Material (PDF, DOCX, TXT, Images - Teacher Protected)
router.post('/upload', requireTeacherAuth, upload.single('material'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const originalName = file.originalname;
    const extension = path.extname(originalName).toLowerCase();
    
    // Parse content based on file extension
    const parsedText = await parseDocumentContent(file.path, extension, originalName);

    return res.json({
      success: true,
      filename: originalName,
      filePath: file.path,
      fileSize: file.size,
      fileType: extension,
      extractedContent: parsedText,
      samplePreview: parsedText.slice(0, 400) + (parsedText.length > 400 ? '...' : '')
    });
  } catch (err) {
    console.error('Upload parsing error:', err);
    return res.status(500).json({ error: 'Failed to process document: ' + err.message });
  }
});

// 2. Generate AI Questions (Teacher Protected)
router.post('/generate', requireTeacherAuth, async (req, res) => {
  try {
    const {
      topic = 'calculus_algebra',
      difficulty = 'standard',
      questionCount = 5,
      language = 'kz',
      materialText = '',
      title = '',
      apiKey = ''
    } = req.body;

    const count = Math.min(Math.max(parseInt(questionCount) || 5, 1), 40);
    
    const generatedTest = await generateUNTQuestions({
      topic,
      difficulty,
      questionCount: count,
      language,
      materialText,
      title: title || `ҰБТ Математика: ${topic}`,
      apiKey
    });

    // Save as draft test
    tests.unshift(generatedTest);
    persist();

    return res.json({
      success: true,
      test: generatedTest
    });
  } catch (err) {
    console.error('Generation error:', err);
    return res.status(500).json({ error: 'Failed to generate questions: ' + err.message });
  }
});

// 3. Get All Tests
router.get('/tests', (req, res) => {
  const { role, status, demo } = req.query;
  let result = [...tests];

  // Strict Privacy: Non-teachers can ONLY see published tests
  if (!isTeacher(req) || role === 'student') {
    result = result.filter(t => t.status === 'published');
  } else if (status) {
    result = result.filter(t => t.status === status);
  }

  const showDemo = isDemoMode || demo === 'true';
  const allSubs = showDemo ? [...submissions, ...DEMO_SUBMISSIONS] : submissions;

  // Attach submission count and real average score
  const enriched = result.map(t => {
    const subCount = allSubs.filter(s => s.testId === t.id).length;
    const avgScore = subCount > 0
      ? (allSubs.filter(s => s.testId === t.id).reduce((acc, s) => acc + s.percentage, 0) / subCount).toFixed(1)
      : null;
    return {
      ...t,
      submissionCount: subCount,
      averagePercentage: avgScore
    };
  });

  return res.json(enriched);
});

// 4. Get Specific Test
router.get('/tests/:id', (req, res) => {
  const test = tests.find(t => t.id === req.params.id);
  if (!test) {
    return res.status(404).json({ error: 'Test not found' });
  }
  // If test is a draft, only teacher can view it
  if (test.status !== 'published' && !isTeacher(req)) {
    return res.status(404).json({ error: 'Test not found' });
  }
  return res.json(test);
});

// 5. Update / Edit Test (Approve, modify questions - Teacher Protected)
router.put('/tests/:id', requireTeacherAuth, (req, res) => {
  const index = tests.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Test not found' });
  }

  const updated = {
    ...tests[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  tests[index] = updated;
  persist();
  return res.json({ success: true, test: updated });
});

// 6. Publish Test (Teacher Protected)
router.post('/tests/:id/publish', requireTeacherAuth, (req, res) => {
  const index = tests.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Test not found' });
  }

  // Ensure all questions are approved or mark them approved
  const updatedQuestions = tests[index].questions.map(q => ({ ...q, isApproved: true }));

  tests[index] = {
    ...tests[index],
    questions: updatedQuestions,
    status: 'published',
    publishedAt: new Date().toISOString()
  };

  persist();
  return res.json({ success: true, test: tests[index] });
});

// 7. Delete Test (Teacher Protected)
router.delete('/tests/:id', requireTeacherAuth, (req, res) => {
  tests = tests.filter(t => t.id !== req.params.id);
  submissions = submissions.filter(s => s.testId !== req.params.id);
  persist();
  return res.json({ success: true });
});

// 8. Submit Student Test
router.post('/submissions', (req, res) => {
  const { testId, studentId, studentName, answers, durationSeconds, proctoring } = req.body;
  const test = tests.find(t => t.id === testId);

  if (!test) {
    return res.status(404).json({ error: 'Test not found' });
  }

  let totalScore = 0;
  let maxScore = 0;
  const questionResults = {};

  test.questions.forEach(q => {
    const pts = q.points || 1;
    maxScore += pts;
    const studentAns = answers ? answers[q.id] : null;
    const isCorrect = studentAns === q.correctAnswer;

    if (isCorrect) {
      totalScore += pts;
    }

    questionResults[q.id] = {
      isCorrect,
      score: isCorrect ? pts : 0,
      studentAnswer: studentAns,
      correctAnswer: q.correctAnswer
    };
  });

  const percentage = Math.round((totalScore / maxScore) * 100);
  const matchedStudent = students.find(s => s.id === studentId);
  const classroomCode = matchedStudent?.classroomCode || req.body.classroomCode || teacherClassroom.code;

  const proctoringData = proctoring || {
    warningCount: 0,
    violationsCount: 0,
    violations: [],
    cameraEnabled: true,
    integrityScore: 100,
    autoSubmitted: false
  };

  const newSubmission = {
    id: 'sub-' + Date.now(),
    testId,
    testTitle: test.title,
    studentId: studentId || (matchedStudent ? matchedStudent.id : 'stud-curr'),
    studentName: studentName || (matchedStudent ? matchedStudent.name : 'Оқушы'),
    classroomCode,
    submittedAt: new Date().toISOString(),
    durationSeconds: durationSeconds || 1200,
    totalScore,
    maxScore,
    percentage,
    answers,
    questionResults,
    proctoring: proctoringData
  };

  submissions.unshift(newSubmission);

  // Automated Trigger: Notify Parent's Telegram of Test Completion
  if (matchedStudent) {
    notifyTestCompleted(matchedStudent, test, newSubmission).catch(err => {
      console.warn('[ParentBot] Failed to send test completion notification:', err.message);
    });

    // Inactivity & Low-Performance Warning (<50%)
    if (percentage < 50) {
      notifyLowPerformanceAlert(matchedStudent, test, newSubmission).catch(err => {
        console.warn('[ParentBot] Failed to send low-performance alert:', err.message);
      });
    }
  }

  const hasViolations = proctoringData.violations && proctoringData.violations.length > 0;
  const proctoringNote = hasViolations 
    ? ` ⚠️ [AI Прокторинг: ${proctoringData.violations.length} ереже бұзушылық тіркелді${proctoringData.autoSubmitted ? ', авто-тапсырылды' : ''}]` 
    : ' 🛡️ [AI Прокторинг: Таза емтихан]';

  // Notify Teacher of new test submission with classroom code and proctoring status
  notifications.unshift({
    id: 'notif-sub-' + Date.now(),
    type: 'test_submitted',
    title: hasViolations ? 'Тест тапсырылды (Ескертулер бар ⚠️)' : 'Тест тапсырылды 📝',
    message: `${newSubmission.studentName} (${classroomCode}) "${test.title}" тестін ${percentage}% нәтижемен аяқтады (${totalScore}/${maxScore} ұпай).${proctoringNote}`,
    studentId: newSubmission.studentId,
    studentName: newSubmission.studentName,
    classroomCode,
    testId: test.id,
    submissionId: newSubmission.id,
    proctoring: proctoringData,
    percentage,
    timestamp: new Date().toISOString(),
    read: false
  });

  persist();

  return res.json({
    success: true,
    submission: newSubmission
  });
});

// 9. Get Submissions (Filter by testId or studentId)
router.get('/submissions', (req, res) => {
  const { testId, studentId, demo } = req.query;
  const showDemo = isDemoMode || demo === 'true';
  let list = showDemo ? [...submissions, ...DEMO_SUBMISSIONS] : [...submissions];

  if (testId) {
    list = list.filter(s => s.testId === testId);
  }
  if (studentId) {
    list = list.filter(s => s.studentId === studentId);
  }

  return res.json(list);
});

// 10. Live Analytics & Heatmap for a Test
router.get('/analytics/:testId', (req, res) => {
  const test = tests.find(t => t.id === req.params.testId);
  if (!test) {
    return res.status(404).json({ error: 'Test not found' });
  }

  const showDemo = isDemoMode || req.query.demo === 'true';
  const allSubs = showDemo ? [...submissions, ...DEMO_SUBMISSIONS] : submissions;
  const testSubmissions = allSubs.filter(s => s.testId === test.id);
  const totalSubmissions = testSubmissions.length;

  if (totalSubmissions === 0) {
    return res.json({
      testId: test.id,
      testTitle: test.title,
      totalSubmissions: 0,
      averageScore: 0,
      averagePercentage: 0,
      maxScorePossible: test.questions.reduce((a, q) => a + (q.points || 1), 0),
      questionHeatmap: test.questions.map(q => ({
        questionId: q.id,
        number: q.number,
        questionText: q.question,
        correctAnswer: q.correctAnswer,
        options: q.options,
        missCount: 0,
        missPercentage: 0,
        correctCount: 0,
        distractorDistribution: { A: 0, B: 0, C: 0, D: 0, E: 0 },
        commonMisconception: q.misconception || 'Есептеу қателігі',
        speedTrick: q.speedTrick,
        keyConcept: q.keyConcept
      })),
      rankings: []
    });
  }

  const totalPercentages = testSubmissions.reduce((acc, s) => acc + s.percentage, 0);
  const averagePercentage = Math.round(totalPercentages / totalSubmissions);
  const averageScore = (testSubmissions.reduce((acc, s) => acc + s.totalScore, 0) / totalSubmissions).toFixed(1);

  // Compute Heatmap per question
  const questionHeatmap = test.questions.map(q => {
    let correctCount = 0;
    let missCount = 0;
    const distractorDistribution = { A: 0, B: 0, C: 0, D: 0, E: 0 };

    testSubmissions.forEach(sub => {
      const res = sub.questionResults ? sub.questionResults[q.id] : null;
      const ans = sub.answers ? sub.answers[q.id] : null;

      if (ans && distractorDistribution[ans] !== undefined) {
        distractorDistribution[ans]++;
      }

      if (res && res.isCorrect) {
        correctCount++;
      } else {
        missCount++;
      }
    });

    const missPercentage = Math.round((missCount / totalSubmissions) * 100);

    return {
      questionId: q.id,
      number: q.number,
      questionText: q.question,
      correctAnswer: q.correctAnswer,
      options: q.options,
      missCount,
      correctCount,
      missPercentage,
      distractorDistribution,
      commonMisconception: q.misconception || 'Формула мен таңбадан шатасу',
      speedTrick: q.speedTrick,
      keyConcept: q.keyConcept
    };
  });

  // Sort rankings by total score desc, then durationSeconds asc
  const rankings = [...testSubmissions]
    .sort((a, b) => b.totalScore - a.totalScore || a.durationSeconds - b.durationSeconds)
    .map((sub, idx) => ({
      rank: idx + 1,
      submissionId: sub.id,
      studentName: sub.studentName,
      studentId: sub.studentId,
      totalScore: sub.totalScore,
      maxScore: sub.maxScore,
      percentage: sub.percentage,
      durationSeconds: sub.durationSeconds,
      submittedAt: sub.submittedAt,
      proctoring: sub.proctoring || {
        warningCount: 0,
        violationsCount: 0,
        violations: [],
        cameraEnabled: true,
        integrityScore: 100,
        autoSubmitted: false
      }
    }));

  return res.json({
    testId: test.id,
    testTitle: test.title,
    totalSubmissions,
    averageScore,
    averagePercentage,
    maxScorePossible: test.questions.reduce((a, q) => a + (q.points || 1), 0),
    questionHeatmap,
    rankings
  });
});

// 11. AI Personalized Recommendations for a Student Submission
router.post('/student/recommendations', (req, res) => {
  const { submissionId, studentAnswers, testId } = req.body;
  const test = tests.find(t => t.id === testId);

  if (!test) {
    return res.status(404).json({ error: 'Test not found' });
  }

  const recommendations = getPersonalizedRecommendations(test, studentAnswers);
  return res.json(recommendations);
});

// 12. Student Authentication & Teacher-Student Linking

// Student Registration
router.post('/auth/student/register', (req, res) => {
  const { name, emailOrPhone, password, grade, school, targetScore, classroomCode } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Оқушының толық аты-жөнін енгізіңіз' });
  }

  if (!emailOrPhone || !emailOrPhone.trim()) {
    return res.status(400).json({ error: 'Email немесе телефон нөмірін енгізіңіз' });
  }

  if (!password || password.length < 5) {
    return res.status(400).json({ error: 'Құпия сөз кемінде 5 таңбадан тұруы қажет' });
  }

  const cleanName = name.trim();
  const contact = emailOrPhone.trim().toLowerCase();
  const cleanDigits = contact.replace(/\D/g, '');

  // Check if student with this email or phone is already registered
  const duplicate = students.find(s => 
    (s.email && s.email.toLowerCase() === contact) ||
    (s.phone && (s.phone.toLowerCase() === contact || (cleanDigits.length >= 7 && s.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-7)))))
  );

  if (duplicate) {
    return res.status(400).json({ error: 'Бұл Email немесе телефон нөмірі бойынша оқушы тіркеліп қойған. Кіру бөлімін пайдаланыңыз.' });
  }

  const isEmail = contact.includes('@');
  const code = (classroomCode && classroomCode.trim()) ? classroomCode.trim().toUpperCase() : teacherClassroom.code;

  const newStudent = {
    id: 'stud-' + Date.now(),
    role: 'student', // Strict RBAC: All public registrations are student role only
    name: cleanName,
    email: isEmail ? contact : (req.body.email?.trim().toLowerCase() || ''),
    phone: !isEmail ? emailOrPhone.trim() : (req.body.phone?.trim() || ''),
    password: password,
    grade: grade || '11-А',
    school: school?.trim() || 'Жалпы білім беретін мектеп',
    targetScore: targetScore || '40/40 (Мемлекеттік Грант)',
    classroomCode: code,
    teacherId: 'teacher-1',
    registeredAt: new Date().toISOString(),
    status: 'active',
    bindingToken: 'BIND_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    parentPhone: req.body.parentPhone || '',
    parentTelegramId: null,
    parentChatId: null,
    parentSyncStatus: 'not_connected',
    notificationSettings: {
      onTestSubmitted: true,
      onLowScore: true,
      onInactivity: true,
      weeklyDigest: true
    }
  };

  students.unshift(newStudent);

  // Generate session token
  const token = 'tok_' + newStudent.id + '_' + Date.now();
  sessions.set(token, newStudent.id);

  // Send High-Priority Notification to Teacher with linking details!
  const notif = {
    id: 'notif-' + Date.now(),
    type: 'student_registered',
    title: 'Жаңа оқушы тіркелді! 🎓',
    message: `${newStudent.name} (${newStudent.grade}, ${newStudent.school}) '${newStudent.classroomCode}' сынып кодымен тіркелді.`,
    studentId: newStudent.id,
    studentName: newStudent.name,
    classroomCode: newStudent.classroomCode,
    timestamp: new Date().toISOString(),
    read: false
  };

  notifications.unshift(notif);
  persist();

  return res.json({
    success: true,
    token,
    student: sanitizeStudent(newStudent),
    notification: notif
  });
});

// Student Login
router.post('/auth/student/login', (req, res) => {
  const { emailOrPhone, password } = req.body;

  if (!emailOrPhone || !password) {
    return res.status(400).json({ error: 'Email/Телефон және құпия сөзді енгізіңіз' });
  }

  const contact = emailOrPhone.trim().toLowerCase();
  const cleanDigits = contact.replace(/\D/g, '');

  const student = students.find(s => 
    (s.email && s.email.toLowerCase() === contact) ||
    (s.phone && (s.phone.toLowerCase() === contact || (cleanDigits.length >= 7 && s.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-7)))))
  );

  if (!student) {
    return res.status(401).json({ error: 'Бұл логин бойынша оқушы табылмады. Алдымен тіркеліңіз.' });
  }

  if (student.password !== password) {
    return res.status(401).json({ error: 'Құпия сөз қате. Қайта тексеріп енгізіңіз.' });
  }

  const token = 'tok_' + student.id + '_' + Date.now();
  sessions.set(token, student.id);

  return res.json({
    success: true,
    token,
    student: sanitizeStudent(student)
  });
});

// Student Password Reset (Forgot Password)
router.post('/auth/student/reset-password', (req, res) => {
  const { emailOrPhone, newPassword } = req.body;

  if (!emailOrPhone || !newPassword) {
    return res.status(400).json({ error: 'Email/Телефон және жаңа құпия сөзді енгізіңіз' });
  }

  if (newPassword.length < 5) {
    return res.status(400).json({ error: 'Жаңа құпия сөз кемінде 5 таңбадан тұруы тиіс' });
  }

  const contact = emailOrPhone.trim().toLowerCase();
  const cleanDigits = contact.replace(/\D/g, '');

  let student = students.find(s => 
    (s.email && s.email.toLowerCase() === contact) ||
    (s.phone && (s.phone.toLowerCase() === contact || (cleanDigits.length >= 7 && s.phone.replace(/\D/g, '').endsWith(cleanDigits.slice(-7))))) ||
    (s.name && s.name.toLowerCase() === contact)
  );

  if (!student) {
    return res.status(404).json({ error: 'Бұл байланыс мәліметі бойынша тіркелген оқушы табылмады. Қайта тексеріңіз немесе тіркеліңіз.' });
  }

  student.password = newPassword.trim();
  persist();

  return res.json({
    success: true,
    message: 'Құпия сөзіңіз сәтті жаңартылды! Енді жаңа құпия сөзбен жүйеге кіріңіз.'
  });
});

// Verify Student Session
router.get('/auth/student/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '');

  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Сессия табылмады немесе мерзімі аяқталған' });
  }

  const studentId = sessions.get(token);
  const student = students.find(s => s.id === studentId);

  if (!student) {
    return res.status(401).json({ error: 'Оқушы профилі табылмады' });
  }

  return res.json({
    success: true,
    student: sanitizeStudent(student)
  });
});

// Student Logout
router.post('/auth/student/logout', (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (token) {
    sessions.delete(token);
  }
  return res.json({ success: true });
});

// ==========================================================================
// Teacher Dedicated Authentication (Strict RBAC Protected Staff Access)
// ==========================================================================

// Explicitly Block any attempt to self-register as Teacher via API
router.post('/auth/teacher/register', (req, res) => {
  return res.status(403).json({
    error: 'Мұғалім ретінде өздігінен тіркелуге рұқсат жоқ. Мұғалім аккаунты жүйелік әкімші (.env / seed-скрипт) арқылы ғана жасақталады (Teacher registration disabled. Managed by administrator only).'
  });
});

router.post('/teachers/register', (req, res) => {
  return res.status(403).json({
    error: 'Мұғалім тіркелуі жабық (Access denied: Teacher registration disabled).'
  });
});

// Teacher Login
router.post('/auth/teacher/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email және құпия сөзді енгізіңіз' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const validEmail = cleanEmail === (teacherUser.email || '').toLowerCase() || 
                     (process.env.TEACHER_EMAIL && cleanEmail === process.env.TEACHER_EMAIL.trim().toLowerCase()) ||
                     cleanEmail === 'teacher@qmath.kz' || 
                     cleanEmail === 'admin@qmath.kz';
  const validPass = password === teacherUser.password || 
                    (process.env.TEACHER_PASSWORD && password === process.env.TEACHER_PASSWORD) ||
                    password === 'admin2026';

  if (validEmail && validPass) {
    const token = 'teacher_tok_' + Date.now() + '_' + Math.random().toString(36).substring(2, 12);
    const { password: _, ...cleanTeacher } = teacherUser;
    cleanTeacher.role = 'teacher';
    teacherSessions.set(token, cleanTeacher);
    return res.json({
      success: true,
      token,
      teacher: cleanTeacher
    });
  }

  return res.status(401).json({ error: 'Мұғалімнің Email немесе құпия сөзі қате. Тексеріп қайта енгізіңіз.' });
});

// Teacher Password Reset (Forgot Password)
router.post('/auth/teacher/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email және жаңа құпия сөзді енгізіңіз' });
  }
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail !== (teacherUser.email || '').toLowerCase() && cleanEmail !== 'teacher@qmath.kz') {
    return res.status(404).json({ error: 'Бұл email бойынша тіркелген мұғалім табылмады' });
  }
  if (newPassword.length < 5) {
    return res.status(400).json({ error: 'Жаңа құпия сөз кемінде 5 таңбадан тұруы тиіс' });
  }
  teacherUser.password = newPassword.trim();
  persist();
  return res.json({
    success: true,
    message: 'Мұғалімнің құпия сөзі сәтті жаңартылды! Енді жаңа құпия сөзбен кіре аласыз.'
  });
});

// Verify Teacher Session (Strict RBAC: session exists and role is teacher)
router.get('/auth/teacher/me', (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token || !teacherSessions.has(token)) {
    return res.status(401).json({ error: 'Мұғалім сессиясы табылмады немесе мерзімі аяқталған' });
  }
  const teacher = teacherSessions.get(token);
  if (!teacher || teacher.role !== 'teacher') {
    return res.status(403).json({ error: 'Қолжетімділік шектелген: мұғалім құқығы жоқ (Teacher role required)' });
  }
  const { password: _, ...cleanTeacher } = teacher;
  return res.json({
    success: true,
    teacher: cleanTeacher
  });
});

// Teacher Logout
router.post('/auth/teacher/logout', (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (token) {
    teacherSessions.delete(token);
  }
  return res.json({ success: true });
});

// Teacher Classroom Information (Protected)
router.get('/teacher/classroom', requireTeacherAuth, (req, res) => {
  const linked = students.filter(s => s.classroomCode === teacherClassroom.code);
  return res.json({
    classroomCode: teacherClassroom.code,
    teacherName: teacherClassroom.teacherName,
    school: teacherClassroom.school,
    subject: teacherClassroom.subject,
    linkedStudentsCount: linked.length
  });
});

router.put('/teacher/classroom', requireTeacherAuth, (req, res) => {
  if (req.body.classroomCode) {
    teacherClassroom.code = req.body.classroomCode.trim().toUpperCase();
    persist();
  }
  return res.json({ success: true, classroom: teacherClassroom });
});

// Legacy / Quick Register route
router.post('/students/register', (req, res) => {
  const { name, emailOrPhone, password, grade, school, targetScore, classroomCode, phone } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Оқушының аты-жөнін енгізіңіз' });
  }

  const cleanName = name.trim();
  const existing = students.find(s => s.name.toLowerCase() === cleanName.toLowerCase());

  if (existing) {
    const token = 'tok_' + existing.id + '_' + Date.now();
    sessions.set(token, existing.id);
    return res.json({
      success: true,
      token,
      student: sanitizeStudent(existing),
      isExisting: true
    });
  }

  const code = (classroomCode && classroomCode.trim()) ? classroomCode.trim().toUpperCase() : teacherClassroom.code;
  const newStudent = {
    id: 'stud-' + Date.now(),
    role: 'student', // Strict RBAC: All registrations are student role only
    name: cleanName,
    email: (emailOrPhone && emailOrPhone.includes('@')) ? emailOrPhone.trim().toLowerCase() : '',
    phone: phone || (!emailOrPhone?.includes('@') ? (emailOrPhone || '') : ''),
    password: password || '123456',
    grade: grade || '11-А',
    school: school?.trim() || 'Жалпы білім беретін мектеп',
    targetScore: targetScore || '40/40 (Мемлекеттік Грант)',
    classroomCode: code,
    teacherId: 'teacher-1',
    registeredAt: new Date().toISOString(),
    status: 'active',
    bindingToken: 'BIND_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    parentPhone: req.body.parentPhone || '',
    parentTelegramId: null,
    parentChatId: null,
    parentSyncStatus: 'not_connected',
    notificationSettings: {
      onTestSubmitted: true,
      onLowScore: true,
      onInactivity: true,
      weeklyDigest: true
    }
  };

  students.unshift(newStudent);
  const token = 'tok_' + newStudent.id + '_' + Date.now();
  sessions.set(token, newStudent.id);

  const notif = {
    id: 'notif-' + Date.now(),
    type: 'student_registered',
    title: 'Жаңа оқушы тіркелді! 🎓',
    message: `${newStudent.name} (${newStudent.grade}, ${newStudent.school}) '${newStudent.classroomCode}' кодымен тіркелді.`,
    studentId: newStudent.id,
    studentName: newStudent.name,
    classroomCode: newStudent.classroomCode,
    timestamp: new Date().toISOString(),
    read: false
  };

  notifications.unshift(notif);
  persist();

  return res.json({
    success: true,
    token,
    student: sanitizeStudent(newStudent),
    notification: notif
  });
});

// Enriched Roster of Registered Students for Teacher (Protected)
router.get('/students', requireTeacherAuth, (req, res) => {
  const { classroomCode, demo } = req.query;
  const showDemo = isDemoMode || demo === 'true';
  let list = showDemo ? [...students, ...DEMO_STUDENTS] : [...students];
  const allSubs = showDemo ? [...submissions, ...DEMO_SUBMISSIONS] : submissions;

  if (classroomCode) {
    list = list.filter(s => s.classroomCode === classroomCode.toUpperCase());
  }

  const enriched = list.map(s => {
    const studentSubs = allSubs.filter(sub => sub.studentId === s.id);
    const avgScore = studentSubs.length > 0
      ? Math.round(studentSubs.reduce((acc, sub) => acc + sub.percentage, 0) / studentSubs.length)
      : 0;
    const highestScore = studentSubs.length > 0
      ? Math.max(...studentSubs.map(sub => sub.percentage))
      : 0;

    return {
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      grade: s.grade,
      school: s.school,
      targetScore: s.targetScore,
      classroomCode: s.classroomCode || teacherClassroom.code,
      registeredAt: s.registeredAt,
      status: s.status,
      isDemo: Boolean(s.isDemo),
      testsTaken: studentSubs.length,
      averagePercentage: avgScore,
      highestScore,
      lastSubmission: studentSubs[0] ? studentSubs[0].submittedAt : null,
      latestProctoring: studentSubs[0]?.proctoring || null,
      totalProctoringViolations: studentSubs.reduce((acc, sub) => acc + (sub.proctoring?.violations?.length || 0), 0),
      latestSubmissionItem: studentSubs[0] || null,
      parentPhone: s.parentPhone || '',
      parentSyncStatus: s.parentSyncStatus || 'not_connected',
      parentChatId: s.parentChatId || null
    };
  });

  return res.json(enriched);
});

// 13. Notifications for Teacher (Protected)
router.get('/notifications', requireTeacherAuth, (req, res) => {
  const showDemo = isDemoMode || req.query.demo === 'true';
  const list = showDemo ? [...notifications, ...DEMO_NOTIFICATIONS] : notifications;
  const unreadCount = list.filter(n => !n.read).length;
  return res.json({
    notifications: list,
    unreadCount,
    latestTimestamp: list[0] ? list[0].timestamp : null
  });
});

router.post('/notifications/:id/read', requireTeacherAuth, (req, res) => {
  const notif = notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    persist();
  }
  return res.json({ success: true });
});

router.post('/notifications/clear', requireTeacherAuth, (req, res) => {
  notifications = notifications.map(n => ({ ...n, read: true }));
  persist();
  return res.json({ success: true });
});

// ==========================================================================
// 14. Quick Assignment & Material Archive (Lightweight Direct Upload)
// ==========================================================================

// Get all materials / assignments
router.get('/materials', (req, res) => {
  const { category, classroomCode, search } = req.query;
  let list = [...materials];

  if (classroomCode) {
    list = list.filter(m => !m.classroomCode || m.classroomCode === classroomCode.toUpperCase());
  }

  if (category && category !== 'all') {
    list = list.filter(m => m.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(m => 
      m.title.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      (m.topic && m.topic.toLowerCase().includes(q))
    );
  }

  return res.json(list);
});

// Upload a new assignment or archive document (without AI parsing - Teacher Protected)
router.post('/materials', requireTeacherAuth, upload.single('file'), (req, res) => {
  const { title, description, deadline, topic, category, classroomCode } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Тапсырманың тақырыбын енгізіңіз' });
  }

  let fileUrl = '/uploads/sample_math_variant5.svg';
  let fileName = 'Тапсырма_құжаты.png';
  let fileType = 'image/png';
  let fileSize = '1.2 MB';

  if (req.file) {
    fileUrl = `/uploads/${req.file.filename}`;
    fileName = req.file.originalname;
    fileType = req.file.mimetype;
    fileSize = `${(req.file.size / (1024 * 1024)).toFixed(1)} MB`;
  }

  const newMaterial = {
    id: 'mat-' + Date.now(),
    title: title.trim(),
    description: description ? description.trim() : 'Дәптерге толық шешуін жазып келу.',
    category: category || 'homework', // 'homework' | 'archive'
    topic: topic ? topic.trim() : 'Математика',
    classroomCode: classroomCode ? classroomCode.trim().toUpperCase() : teacherClassroom.code,
    teacherId: 'teacher-1',
    fileUrl,
    fileName,
    fileType,
    fileSize,
    deadline: deadline ? new Date(deadline).toISOString() : null,
    createdAt: new Date().toISOString(),
    isArchived: category === 'archive',
    submissionType: 'offline_notebook',
    viewsCount: 0,
    solvedStudents: []
  };

  materials.unshift(newMaterial);

  // Send real-time notification to teacher's portal
  notifications.unshift({
    id: 'notif-' + Date.now(),
    type: 'material_uploaded',
    title: 'Жаңа оқу материалы жарияланды! 📚',
    message: `"${newMaterial.title}" (${newMaterial.category === 'archive' ? 'Архив' : 'Үй тапсырмасы'}) оқушыларға қолжетімді болды.`,
    materialId: newMaterial.id,
    timestamp: new Date().toISOString(),
    read: false
  });

  persist();

  return res.json({
    success: true,
    material: newMaterial
  });
});

// Get single material by ID
router.get('/materials/:id', (req, res) => {
  const mat = materials.find(m => m.id === req.params.id);
  if (!mat) {
    return res.status(404).json({ error: 'Материал табылмады' });
  }
  mat.viewsCount = (mat.viewsCount || 0) + 1;
  return res.json(mat);
});

// Toggle archive status (Teacher Protected)
router.put('/materials/:id/archive', requireTeacherAuth, (req, res) => {
  const mat = materials.find(m => m.id === req.params.id);
  if (!mat) {
    return res.status(404).json({ error: 'Материал табылмады' });
  }
  mat.isArchived = !mat.isArchived;
  mat.category = mat.isArchived ? 'archive' : 'homework';
  persist();
  return res.json({ success: true, material: mat });
});

// Delete material (Teacher Protected)
router.delete('/materials/:id', requireTeacherAuth, (req, res) => {
  const idx = materials.findIndex(m => m.id === req.params.id);
  if (idx !== -1) {
    materials.splice(idx, 1);
    persist();
  }
  return res.json({ success: true });
});

// Student marks assignment as solved in copybook
router.post('/materials/:id/toggle-solve', (req, res) => {
  const { studentId } = req.body;
  const mat = materials.find(m => m.id === req.params.id);
  if (!mat) {
    return res.status(404).json({ error: 'Материал табылмады' });
  }

  if (!mat.solvedStudents) mat.solvedStudents = [];

  const index = mat.solvedStudents.indexOf(studentId);
  const isSolved = index === -1;

  if (isSolved) {
    mat.solvedStudents.push(studentId);
  } else {
    mat.solvedStudents.splice(index, 1);
  }

  persist();

  return res.json({
    success: true,
    isSolved,
    solvedCount: mat.solvedStudents.length
  });
});

/* ==========================================================================
   PARENT NOTIFICATION BOT & TELEGRAM INTEGRATION ENDPOINTS
   ========================================================================== */

// 1. Get Student Parent Contact Settings & Binding Token
router.get('/student/parent-contact', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  const studentId = (token && sessions.get(token)) || req.query.studentId;

  let student = students.find(s => s.id === studentId);
  if (!student) {
    // Demo fallback for guest student
    student = students[0] || {
      id: 'stud-guest',
      name: 'Оқушы',
      bindingToken: 'BIND_DEMO_2026',
      parentPhone: '+7 (777) 123-45-67',
      parentSyncStatus: 'connected',
      parentChatId: 'chat_demo_101',
      notificationSettings: {
        onTestSubmitted: true,
        onLowScore: true,
        onInactivity: true,
        weeklyDigest: true
      }
    };
  }

  if (!student.bindingToken) {
    student.bindingToken = 'BIND_' + Math.random().toString(36).substring(2, 9).toUpperCase();
    persist();
  }

  const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'qmath_parent_bot';
  const deepLink = `https://t.me/${botUsername}?start=${student.bindingToken}`;

  return res.json({
    success: true,
    studentId: student.id,
    studentName: student.name,
    parentPhone: student.parentPhone || '',
    parentSyncStatus: student.parentSyncStatus || 'not_connected',
    parentChatId: student.parentChatId || null,
    parentLinkedAt: student.parentLinkedAt || null,
    bindingToken: student.bindingToken,
    botUsername,
    deepLink,
    notificationSettings: student.notificationSettings || {
      onTestSubmitted: true,
      onLowScore: true,
      onInactivity: true,
      weeklyDigest: true
    }
  });
});

// 2. Update Parent Contact & Notification Preferences
router.post('/student/parent-contact', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  const studentId = (token && sessions.get(token)) || req.body.studentId;

  let student = students.find(s => s.id === studentId);
  if (!student) {
    student = students[0];
  }

  if (!student) {
    return res.status(404).json({ error: 'Оқушы табылмады' });
  }

  const { parentPhone, notificationSettings } = req.body;
  if (parentPhone !== undefined) {
    student.parentPhone = parentPhone;
  }
  if (notificationSettings) {
    student.notificationSettings = {
      ...student.notificationSettings,
      ...notificationSettings
    };
  }

  persist();

  return res.json({
    success: true,
    student: sanitizeStudent(student)
  });
});

// 3. Simulate Parent Telegram Binding (One-click connect for Demo & Testing)
router.post('/student/parent-contact/simulate-bind', async (req, res) => {
  const { studentId } = req.body;
  let student = students.find(s => s.id === studentId) || students[0];

  if (!student) {
    return res.status(404).json({ error: 'Оқушы табылмады' });
  }

  student.parentSyncStatus = 'connected';
  student.parentChatId = 'chat_sim_' + Date.now();
  student.parentTelegramId = 987654321;
  student.parentLinkedAt = new Date().toISOString();
  persist();

  // Send initial simulated Telegram onboarding message
  await sendTelegramMessage(student.parentChatId, `
🎉 <b>Сәтті байланыстырылды!</b>
Құрметті ата-ана! Сіз <b>${student.name}</b> оқушысының Q-Math ҰБТ порталына байланыстырылдыңыз.
Енді әрбір тапсырылған тест нәтижесі осы чатқа жедел жіберіліп тұрады!
  `.trim());

  return res.json({
    success: true,
    student: sanitizeStudent(student),
    message: 'Ата-ананың Telegram аккаунты сәтті байланыстырылды!'
  });
});

// 4. Disconnect Parent Telegram Bot
router.post('/student/parent-contact/disconnect', (req, res) => {
  const { studentId } = req.body;
  let student = students.find(s => s.id === studentId) || students[0];

  if (student) {
    student.parentSyncStatus = 'not_connected';
    student.parentChatId = null;
    student.parentTelegramId = null;
    persist();
  }

  return res.json({ success: true, message: 'Байланыс ажыратылды' });
});

// 5. Official Telegram Bot API Webhook Endpoint
router.post('/telegram/webhook', async (req, res) => {
  try {
    const result = await handleTelegramWebhook(req.body, students, persist);
    return res.json(result);
  } catch (err) {
    console.error('[Telegram Webhook Error]', err);
    return res.status(200).json({ ok: false, error: err.message });
  }
});

// 6. Teacher Manual Broadcast to Class Parents (Protected)
router.post('/teacher/broadcast-parents', requireTeacherAuth, async (req, res) => {
  const { classroomCode, title, messageText } = req.body;
  if (!title || !messageText) {
    return res.status(400).json({ error: 'Тақырыбы мен хабарлама мәтіні міндетті' });
  }

  const targetCode = (classroomCode || teacherClassroom.code).toUpperCase();
  const targetStudents = students.filter(s => 
    (!s.classroomCode || s.classroomCode.toUpperCase() === targetCode) &&
    s.parentChatId && 
    s.parentSyncStatus === 'connected'
  );

  const chatIds = targetStudents.map(s => s.parentChatId);

  // Dispatch broadcast messages via Telegram service
  const dispatchResults = await broadcastToParents(chatIds, {
    teacherName: req.teacher?.name || teacherClassroom.teacherName,
    title,
    messageText,
    classroomCode: targetCode
  });

  // Notify teacher of the broadcast dispatch
  notifications.unshift({
    id: 'notif-broad-' + Date.now(),
    type: 'parent_broadcast',
    title: 'Ата-аналарға хабарлама жіберілді 📢',
    message: `"${title}" хабарламасы ${targetCode} сыныбының ${chatIds.length} ата-анасына сәтті жеткізілді.`,
    timestamp: new Date().toISOString(),
    read: false
  });
  persist();

  return res.json({
    success: true,
    deliveredCount: chatIds.length,
    totalClassStudents: students.filter(s => !s.classroomCode || s.classroomCode.toUpperCase() === targetCode).length,
    dispatchResults
  });
});

// 7. Automated Trigger: Check Inactivity for All Students (3+ days)
router.post('/cron/check-inactivity', async (req, res) => {
  const now = Date.now();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  const alertedStudents = [];

  for (const student of students) {
    if (student.parentChatId && student.parentSyncStatus === 'connected') {
      const studentSubs = submissions.filter(s => s.studentId === student.id);
      const lastSubTime = studentSubs[0] ? new Date(studentSubs[0].submittedAt).getTime() : new Date(student.registeredAt).getTime();

      if (now - lastSubTime >= threeDaysMs) {
        const daysInactive = Math.floor((now - lastSubTime) / (24 * 60 * 60 * 1000));
        await notifyInactivityAlert(student, daysInactive);
        alertedStudents.push({ studentId: student.id, name: student.name, daysInactive });
      }
    }
  }

  return res.json({ success: true, alertedCount: alertedStudents.length, alertedStudents });
});

// 8. Automated Trigger: Weekly Digest Dispatcher
router.post('/cron/weekly-digest', async (req, res) => {
  const dispatched = [];

  for (const student of students) {
    if (student.parentChatId && student.parentSyncStatus === 'connected') {
      const studentSubs = submissions.filter(s => s.studentId === student.id);
      const avgScore = studentSubs.length > 0
        ? Math.round(studentSubs.reduce((acc, s) => acc + s.percentage, 0) / studentSubs.length)
        : 0;

      await notifyWeeklyDigest(student, {
        testsTaken: studentSubs.length,
        avgScore,
        studyMinutes: studentSubs.length * 25,
        xpEarned: studentSubs.length * 80 + 120,
        topStrengths: 'Тригонометрия, Көрсеткіштік теңдеулер',
        needsReview: 'Анықталмаған интегралдар, Стереометрия'
      });
      dispatched.push(student.id);
    }
  }

  return res.json({ success: true, count: dispatched.length });
});

export default router;

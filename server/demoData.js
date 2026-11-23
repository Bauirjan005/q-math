// ==========================================================================
// Q-MATH DEMO SEED DATA (Изолированные демонстрационные данные)
// Используются ТОЛЬКО при включении демонстрационного режима (Demo Mode).
// В обычной реальной работе со школьниками эти данные НЕ отображаются.
// ==========================================================================

export const DEMO_STUDENTS = [
  { 
    id: 'demo-stud-1', 
    name: 'Айгүл Серікқызы', 
    email: 'aigul@mail.kz',
    phone: '+7 (777) 123-4567',
    password: 'password123',
    grade: '11-А', 
    school: 'РФММ, Алматы', 
    targetScore: '40/40 (Грант)', 
    classroomCode: 'MATH-2026',
    teacherId: 'teacher-1',
    registeredAt: '2026-10-05T09:00:00.000Z', 
    status: 'active',
    isDemo: true,
    parentPhone: '+7 (701) 987-6543',
    parentSyncStatus: 'connected',
    parentChatId: 100101,
    bindingToken: 'BIND_AIGUL_2026'
  },
  { 
    id: 'demo-stud-2', 
    name: 'Санжар Болатұлы', 
    email: 'sanzhar@mail.kz',
    phone: '+7 (775) 234-5678',
    password: 'password123',
    grade: '11-Б', 
    school: 'БИЛ, Астана', 
    targetScore: '38/40 (Грант)', 
    classroomCode: 'MATH-2026',
    teacherId: 'teacher-1',
    registeredAt: '2026-10-06T10:30:00.000Z', 
    status: 'active',
    isDemo: true,
    parentPhone: '+7 (775) 876-5432',
    parentSyncStatus: 'connected',
    parentChatId: 100102,
    bindingToken: 'BIND_SANZHAR_2026'
  },
  { 
    id: 'demo-stud-3', 
    name: 'Дильназ Әлішер', 
    email: 'dilnaz@mail.kz',
    phone: '+7 (701) 345-6789',
    password: 'password123',
    grade: '11-А', 
    school: '№178 лицей, Шымкент', 
    targetScore: '35/40', 
    classroomCode: 'MATH-2026',
    teacherId: 'teacher-1',
    registeredAt: '2026-10-06T14:15:00.000Z', 
    status: 'active',
    isDemo: true,
    parentPhone: '+7 (701) 765-4321',
    parentSyncStatus: 'connected',
    parentChatId: 100103,
    bindingToken: 'BIND_DILNAZ_2026'
  },
  { 
    id: 'demo-stud-4', 
    name: 'Ернар Мұрат', 
    email: 'ernar@mail.kz',
    phone: '+7 (705) 456-7890',
    password: 'password123',
    grade: '11-В', 
    school: '№5 мектеп, Қарағанды', 
    targetScore: '30/40', 
    classroomCode: 'MATH-2026',
    teacherId: 'teacher-1',
    registeredAt: '2026-10-07T11:20:00.000Z', 
    status: 'active',
    isDemo: true
  },
  { 
    id: 'demo-stud-5', 
    name: 'Мадина Нұрланқызы', 
    email: 'madina@mail.kz',
    phone: '+7 (771) 567-8901',
    password: 'password123',
    grade: '11-Б', 
    school: '№134 гимназия, Алматы', 
    targetScore: '39/40 (Грант)', 
    classroomCode: 'MATH-2026',
    teacherId: 'teacher-1',
    registeredAt: '2026-10-08T08:45:00.000Z', 
    status: 'active',
    isDemo: true
  }
];

export const DEMO_SUBMISSIONS = [
  {
    id: 'demo-sub-001',
    testId: 'unt-test-101',
    studentId: 'demo-stud-1',
    studentName: 'Айгүл Серікқызы',
    classroomCode: 'MATH-2026',
    submittedAt: '2026-10-08T10:15:00.000Z',
    durationSeconds: 1240,
    totalScore: 5,
    maxScore: 5,
    percentage: 100,
    answers: { q1: 'A', q2: 'B', q3: 'A', q4: 'A', q5: 'A' },
    questionResults: {
      q1: { isCorrect: true, score: 1, studentAnswer: 'A' },
      q2: { isCorrect: true, score: 1, studentAnswer: 'B' },
      q3: { isCorrect: true, score: 1, studentAnswer: 'A' },
      q4: { isCorrect: true, score: 1, studentAnswer: 'A' },
      q5: { isCorrect: true, score: 1, studentAnswer: 'A' }
    },
    isDemo: true
  },
  {
    id: 'demo-sub-002',
    testId: 'unt-test-101',
    studentId: 'demo-stud-2',
    studentName: 'Санжар Болатұлы',
    classroomCode: 'MATH-2026',
    submittedAt: '2026-10-08T11:45:00.000Z',
    durationSeconds: 1530,
    totalScore: 3,
    maxScore: 5,
    percentage: 60,
    answers: { q1: 'A', q2: 'B', q3: 'B', q4: 'B', q5: 'A' },
    questionResults: {
      q1: { isCorrect: true, score: 1, studentAnswer: 'A' },
      q2: { isCorrect: true, score: 1, studentAnswer: 'B' },
      q3: { isCorrect: false, score: 0, studentAnswer: 'B' },
      q4: { isCorrect: false, score: 0, studentAnswer: 'B' },
      q5: { isCorrect: true, score: 1, studentAnswer: 'A' }
    },
    isDemo: true
  },
  {
    id: 'demo-sub-003',
    testId: 'unt-test-101',
    studentId: 'demo-stud-3',
    studentName: 'Дильназ Әлішер',
    classroomCode: 'MATH-2026',
    submittedAt: '2026-10-08T14:30:00.000Z',
    durationSeconds: 1120,
    totalScore: 4,
    maxScore: 5,
    percentage: 80,
    answers: { q1: 'A', q2: 'B', q3: 'B', q4: 'A', q5: 'A' },
    questionResults: {
      q1: { isCorrect: true, score: 1, studentAnswer: 'A' },
      q2: { isCorrect: true, score: 1, studentAnswer: 'B' },
      q3: { isCorrect: false, score: 0, studentAnswer: 'B' },
      q4: { isCorrect: true, score: 1, studentAnswer: 'A' },
      q5: { isCorrect: true, score: 1, studentAnswer: 'A' }
    },
    isDemo: true
  },
  {
    id: 'demo-sub-004',
    testId: 'unt-test-101',
    studentId: 'demo-stud-4',
    studentName: 'Ернар Мұрат',
    classroomCode: 'MATH-2026',
    submittedAt: '2026-10-08T16:00:00.000Z',
    durationSeconds: 1840,
    totalScore: 2,
    maxScore: 5,
    percentage: 40,
    answers: { q1: 'B', q2: 'B', q3: 'B', q4: 'C', q5: 'B' },
    questionResults: {
      q1: { isCorrect: false, score: 0, studentAnswer: 'B' },
      q2: { isCorrect: true, score: 1, studentAnswer: 'B' },
      q3: { isCorrect: false, score: 0, studentAnswer: 'B' },
      q4: { isCorrect: false, score: 0, studentAnswer: 'C' },
      q5: { isCorrect: false, score: 0, studentAnswer: 'B' }
    },
    isDemo: true
  },
  {
    id: 'demo-sub-005',
    testId: 'unt-test-101',
    studentId: 'demo-stud-5',
    studentName: 'Мадина Нұрланқызы',
    classroomCode: 'MATH-2026',
    submittedAt: '2026-10-08T17:20:00.000Z',
    durationSeconds: 1390,
    totalScore: 4,
    maxScore: 5,
    percentage: 80,
    answers: { q1: 'A', q2: 'B', q3: 'B', q4: 'A', q5: 'A' },
    questionResults: {
      q1: { isCorrect: true, score: 1, studentAnswer: 'A' },
      q2: { isCorrect: true, score: 1, studentAnswer: 'B' },
      q3: { isCorrect: false, score: 0, studentAnswer: 'B' },
      q4: { isCorrect: true, score: 1, studentAnswer: 'A' },
      q5: { isCorrect: true, score: 1, studentAnswer: 'A' }
    },
    isDemo: true
  }
];

export const DEMO_NOTIFICATIONS = [
  {
    id: 'demo-notif-1',
    type: 'student_registered',
    title: 'Жаңа оқушы тіркелді 🎓 (Демо)',
    message: 'Мадина Нұрланқызы (11-Б, №134 гимназия, Алматы) математика курсына тіркелді.',
    studentId: 'demo-stud-5',
    studentName: 'Мадина Нұрланқызы',
    timestamp: '2026-10-08T08:45:00.000Z',
    read: true,
    isDemo: true
  },
  {
    id: 'demo-notif-2',
    type: 'test_submitted',
    title: 'Тест тапсырылды 📝 (Демо)',
    message: 'Айгүл Серікқызы "ҰБТ 2026: Математикалық сауаттылық" тестін 100% нәтижемен аяқтады.',
    studentId: 'demo-stud-1',
    studentName: 'Айгүл Серікқызы',
    testId: 'unt-test-101',
    score: 5,
    maxScore: 5,
    percentage: 100,
    timestamp: '2026-10-08T10:15:00.000Z',
    read: true,
    isDemo: true
  }
];

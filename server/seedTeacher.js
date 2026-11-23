import fs from 'fs';
import path from 'path';

// Parse optional .env if present
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {
  // Ignore
}

const dataDir = path.join(process.cwd(), 'server', 'data');
const storeFilePath = path.join(dataDir, 'store.json');

// Ensure directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Credentials priority: CLI arguments > process.env > default secure seed
const email = (process.argv[2] || process.env.TEACHER_EMAIL || 'teacher@qmath.kz').trim().toLowerCase();
const password = process.argv[3] || process.env.TEACHER_PASSWORD || 'admin2026';
const name = process.argv[4] || process.env.TEACHER_NAME || 'Асқар Нұрпейісов';
const school = process.env.TEACHER_SCHOOL || 'РФММ, Алматы';
const classroomCode = process.env.TEACHER_CLASSROOM_CODE || 'MATH-2026';

let store = {};
if (fs.existsSync(storeFilePath)) {
  try {
    store = JSON.parse(fs.readFileSync(storeFilePath, 'utf8'));
  } catch (err) {
    store = {};
  }
}

store.version = store.version || '1.0';
store.lastUpdated = new Date().toISOString();
store.students = store.students || [];
store.submissions = store.submissions || [];
store.notifications = store.notifications || [];
store.materials = store.materials || [];
store.tests = store.tests || [];

store.teacher = {
  id: 'teacher-1',
  email,
  password,
  name,
  role: 'teacher',
  school,
  subject: 'Математика және ҰБТ сараптамасы',
  classroomCode,
  seededAt: new Date().toISOString()
};

store.classroom = store.classroom || {
  code: classroomCode,
  teacherName: name,
  school,
  subject: 'Математика және ҰБТ сараптамасы'
};

fs.writeFileSync(storeFilePath, JSON.stringify(store, null, 2), 'utf8');

console.log('====================================================');
console.log('✅ [Q-Math RBAC] Мұғалім аккаунты сәтті орнатылды!');
console.log(`   Email / Логин:   ${email}`);
console.log(`   Құпия сөз (Pass): ${password}`);
console.log(`   Аты-жөні:        ${name}`);
console.log(`   Сынып коды:      ${classroomCode}`);
console.log(`   Рөлі (Role):     teacher`);
console.log('   Файл:            server/data/store.json');
console.log('====================================================');

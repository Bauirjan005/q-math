import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'server', 'data');
const storeFilePath = path.join(dataDir, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export function loadStore() {
  try {
    if (fs.existsSync(storeFilePath)) {
      const raw = fs.readFileSync(storeFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        students: Array.isArray(parsed.students) ? parsed.students : [],
        submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
        materials: Array.isArray(parsed.materials) ? parsed.materials : [],
        tests: Array.isArray(parsed.tests) ? parsed.tests : [],
        classroom: parsed.classroom || null,
        teacher: parsed.teacher || null
      };
    }
  } catch (err) {
    console.error('[Storage] Error reading store.json, using default empty store:', err.message);
  }

  return {
    students: [],
    submissions: [],
    notifications: [],
    materials: [],
    tests: [],
    classroom: null,
    teacher: null
  };
}

export function saveStore(store) {
  try {
    const payload = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      students: store.students || [],
      submissions: store.submissions || [],
      notifications: store.notifications || [],
      materials: store.materials || [],
      tests: store.tests || [],
      classroom: store.classroom || null,
      teacher: store.teacher || null
    };
    fs.writeFileSync(storeFilePath, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.error('[Storage] Failed to save store.json:', err.message);
  }
}

async function verify() {
  const routes = ['/', '/teacher', '/student'];
  for (const r of routes) {
    const res = await fetch('http://localhost:5173' + r);
    const text = await res.text();
    console.log(`Route ${r}: HTTP ${res.status} | Content-Length: ${text.length} | Has root div: ${text.includes('id="root"')}`);
  }

  // Also test student registration and teacher notifications integration
  const regRes = await fetch('http://localhost:5173/api/students/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Дильназ Серікқызы',
      grade: '11-Б',
      school: 'БИЛ (Білім-Инновация лицейі)',
      targetScore: '40/40 (Мемлекеттік Грант)',
      phone: '+7 705 999 8877'
    })
  });
  console.log('Registration endpoint status:', regRes.status);
  const regData = await regRes.json();
  console.log('Registered student:', regData.student.name);

  const notifRes = await fetch('http://localhost:5173/api/notifications');
  const notifData = await notifRes.json();
  console.log('Teacher unread notifications count:', notifData.unreadCount);
  console.log('Latest notification title:', notifData.notifications[0]?.title);
}

verify().catch(console.error);

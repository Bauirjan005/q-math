async function runTest() {
  console.log('=== 1. TEST STUDENT REGISTRATION WITH AUTH ===');
  const regRes = await fetch('http://localhost:5173/api/auth/student/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Бексұлтан Әбдірахман',
      emailOrPhone: 'bexultan@test.kz',
      password: 'mypassword777',
      grade: '11-А',
      school: '№178 лицей, Алматы',
      targetScore: '40/40 (Мемлекеттік Грант)',
      classroomCode: 'MATH-2026'
    })
  });
  console.log('Register HTTP Status:', regRes.status);
  const regData = await regRes.json();
  console.log('Registered student name:', regData.student?.name);
  console.log('Linked Classroom Code:', regData.student?.classroomCode);
  console.log('Token received:', Boolean(regData.token));
  console.log('Notification created for teacher:', Boolean(regData.notification));

  console.log('\n=== 2. TEST STUDENT LOGIN WITH EMAIL & PASSWORD ===');
  const loginRes = await fetch('http://localhost:5173/api/auth/student/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailOrPhone: 'bexultan@test.kz',
      password: 'mypassword777'
    })
  });
  console.log('Login HTTP Status:', loginRes.status);
  const loginData = await loginRes.json();
  console.log('Logged in student ID:', loginData.student?.id);
  console.log('Student token valid:', Boolean(loginData.token));

  console.log('\n=== 3. TEST AUTH ME WITH BEARER TOKEN ===');
  const meRes = await fetch('http://localhost:5173/api/auth/student/me', {
    headers: { Authorization: `Bearer ${loginData.token}` }
  });
  console.log('Me HTTP Status:', meRes.status);
  const meData = await meRes.json();
  console.log('Verified user profile:', meData.student?.name, 'Email:', meData.student?.email);

  console.log('\n=== 4. TEST SUBMITTING EXAM UNDER AUTHENTICATED STUDENT ===');
  const subRes = await fetch('http://localhost:5173/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      testId: 'unt-test-101',
      studentId: loginData.student.id,
      studentName: loginData.student.name,
      classroomCode: loginData.student.classroomCode,
      answers: { q1: 'A', q2: 'B', q3: 'C', q4: 'D', q5: 'A' },
      durationSeconds: 950
    })
  });
  console.log('Submission HTTP Status:', subRes.status);
  const subData = await subRes.json();
  console.log('Score:', subData.submission?.totalScore, 'Percentage:', subData.submission?.percentage + '%');
  console.log('Submission linked classroom:', subData.submission?.classroomCode);

  console.log('\n=== 5. TEST TEACHER ROSTER VIEW & METRICS ===');
  const rosterRes = await fetch('http://localhost:5173/api/students');
  console.log('Roster HTTP Status:', rosterRes.status);
  const students = await rosterRes.json();
  console.log('Total students in roster:', students.length);
  const bex = students.find(s => s.email === 'bexultan@test.kz');
  console.log('Student found in teacher roster:', Boolean(bex));
  if (bex) {
    console.log('Tests completed:', bex.testsTaken);
    console.log('Average score:', bex.averagePercentage + '%');
    console.log('Classroom code:', bex.classroomCode);
    console.log('Registration date:', bex.registeredAt);
  }

  console.log('\n=== 6. TEST TEACHER NOTIFICATIONS ===');
  const notifRes = await fetch('http://localhost:5173/api/notifications');
  const notifData = await notifRes.json();
  console.log('Teacher unread count:', notifData.unreadCount);
  console.log('Latest 2 notifications:');
  notifData.notifications.slice(0, 2).forEach(n => {
    console.log(` - [${n.type}] ${n.title}: ${n.message}`);
  });
}

runTest().catch(console.error);

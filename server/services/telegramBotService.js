/**
 * Q-Math Telegram Parent Notification Bot Service
 * Handles:
 *  - Telegram Bot API Webhook processing
 *  - Parent-Student account linking via binding tokens
 *  - Test completion triggers with strong/weak areas
 *  - Low performance & inactivity alerts
 *  - Weekly study digest
 *  - Teacher classroom broadcast announcements
 */

export function getBotUsername() {
  return process.env.TELEGRAM_BOT_USERNAME || 'qmath_parent_bot';
}

export function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN || 'DEMO_BOT_TOKEN_QMATH';
}

/**
 * Dispatch an actual HTTP message to Telegram Bot API (or log in demo/dev mode)
 */
export async function sendTelegramMessage(chatId, text, options = {}) {
  if (!chatId) return { success: false, error: 'No chatId provided' };

  const token = getBotToken();

  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    ...options
  };

  // If real bot token is provided, send real request to Telegram
  if (token && !token.startsWith('DEMO_')) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return { success: data.ok, data };
    } catch (err) {
      console.error('[TelegramBotService] Failed to send telegram message:', err);
      return { success: false, error: err.message };
    }
  }

  // Dev / Demo Mode simulation: Log neatly to console
  console.log(`\n======================================================`);
  console.log(`📱 [TELEGRAM BOT SIMULATION -> Chat ID: ${chatId}]`);
  console.log(text.replace(/<[^>]*>?/gm, '')); // Stripped HTML for console
  console.log(`======================================================\n`);

  return { success: true, simulated: true };
}

/**
 * Notification Template: Test Completed
 */
export async function notifyTestCompleted(student, test, submission) {
  if (!student.parentChatId || student.parentSyncStatus !== 'connected') {
    return { success: false, reason: 'Parent not connected' };
  }
  if (student.notificationSettings && student.notificationSettings.onTestSubmitted === false) {
    return { success: false, reason: 'Test notifications disabled by user' };
  }

  const percentage = submission.percentage;
  const totalScore = submission.totalScore;
  const maxScore = submission.maxScore;
  const testTitle = test?.title || 'ҰБТ Математика Тесті';

  // Analyze strong and weak areas from results
  const results = submission.questionResults || {};
  let correctCount = 0;
  let wrongCount = 0;
  Object.values(results).forEach(r => {
    if (r.isCorrect) correctCount++;
    else wrongCount++;
  });

  const statusEmoji = percentage >= 80 ? '🎯' : percentage >= 50 ? '📈' : '⚠️';
  const gradeLabel = percentage >= 80 ? 'Мемлекеттік Грант деңгейі' : percentage >= 50 ? 'Шекті баллдан өтті' : 'Қосымша қайталау қажет';

  const message = `
${statusEmoji} <b>Q-Math: Тест нәтижесі хабарламасы</b>

Құрметті ата-ана! Сіздің балаңыз <b>${student.name}</b> жаңа ҰБТ тестін сәтті аяқтады:

📚 <b>Тест атауы:</b> ${testTitle}
📊 <b>Нәтиже:</b> ${totalScore} / ${maxScore} балл (<b>${percentage}%</b>)
🏆 <b>Деңгейі:</b> ${gradeLabel}
⏱ <b>Жұмсалған уақыт:</b> ${Math.round((submission.durationSeconds || 600) / 60)} минут

✅ <b>Дұрыс жауаптар:</b> ${correctCount} сұрақ
❌ <b>Қате кеткен сұрақтар:</b> ${wrongCount} сұрақ

💡 <i>Оқушы жеке кабинетінде қатемен жұмыс жасап, жасанды интеллект (AI) ұсынған қадамдық шешімдерді талдай алады.</i>

🔗 <a href="https://qmath.kz">Q-Math платформасына өту</a>
  `.trim();

  return await sendTelegramMessage(student.parentChatId, message);
}

/**
 * Notification Template: Low Performance Alert (<50%)
 */
export async function notifyLowPerformanceAlert(student, test, submission) {
  if (!student.parentChatId || student.parentSyncStatus !== 'connected') return;
  if (student.notificationSettings && student.notificationSettings.onLowScore === false) return;

  const message = `
⚠️ <b>Q-Math: Маңызды Академиялық Ескерту</b>

Құрметті ата-ана! <b>${student.name}</b> соңғы тапсырмада төмен нәтиже көрсетті:

📚 <b>Сынақ:</b> ${test.title}
📉 <b>Жинаған балы:</b> ${submission.totalScore}/${submission.maxScore} (<b>${submission.percentage}%</b>)

🔍 <b>Мұғалім ұсынысы:</b>
Оқушыға осы тақырып бойынша формулалар банкін қайта қарап, адаптивті тренажерден қосымша жаттығудан өту ұсынылады.

Сұрақтарыңыз болса, пән мұғаліміне тікелей хабарласа аласыз.
  `.trim();

  return await sendTelegramMessage(student.parentChatId, message);
}

/**
 * Notification Template: Inactivity Alert (3+ days)
 */
export async function notifyInactivityAlert(student, daysInactive = 3) {
  if (!student.parentChatId || student.parentSyncStatus !== 'connected') return;
  if (student.notificationSettings && student.notificationSettings.onInactivity === false) return;

  const message = `
⏰ <b>Q-Math: Дайындық үзілісі туралы хабарлама</b>

Құрметті ата-ана!
Сіздің балаңыз <b>${student.name}</b> соңғы <b>${daysInactive} күн</b> бойы Q-Math порталында жаттығу жасамады.

ҰБТ-ға дайындықта тұрақтылық — грант ұтып алудың басты кепілі! Оқушыға бүгін кемінде 15 минут формула тренажерінде жаттығу немесе экспресс-тест тапсыруды еске салуыңызды сұраймыз.

🔥 <i>Күнделікті 15 минуттық жаттығу нәтижені 40%-ға дейін арттырады.</i>
  `.trim();

  return await sendTelegramMessage(student.parentChatId, message);
}

/**
 * Notification Template: Weekly Progress Digest
 */
export async function notifyWeeklyDigest(student, stats = {}) {
  if (!student.parentChatId || student.parentSyncStatus !== 'connected') return;
  if (student.notificationSettings && student.notificationSettings.weeklyDigest === false) return;

  const {
    testsTaken = 0,
    avgScore = 0,
    studyMinutes = 0,
    xpEarned = 0,
    topStrengths = 'Тригонометрия, Дәрежелер',
    needsReview = 'Интеграл, Стереометрия'
  } = stats;

  const message = `
📊 <b>Q-Math: Апталық Дайындық Дайджесті</b>

Оқушы: <b>${student.name}</b> (${student.grade || '11-сынып'})
Күні: ${new Date().toLocaleDateString('kk-KZ')}

📈 <b>Апта қорытындысы:</b>
• Тапсырылған тесттер: <b>${testsTaken}</b>
• Орташа көрсеткіш: <b>${avgScore}%</b>
• Жұмсалған дайындық уақыты: <b>${Math.round(studyMinutes / 60)} сағат ${studyMinutes % 60} мин</b>
• Жинаған XP ұпайы: <b>+${xpEarned} XP</b>

💪 <b>Мықты меңгерген тақырыптары:</b>
${topStrengths}

🎯 <b>Қосымша назар аударуды қажет ететін тұстары:</b>
${needsReview}

<i>Біз сіздің балаңыздың ҰБТ-да жоғары балл жинауына бірге қолдау көрсетеміз!</i>
  `.trim();

  return await sendTelegramMessage(student.parentChatId, message);
}

/**
 * Notification Template: Teacher Broadcast Announcement
 */
export async function broadcastToParents(parentChatIds, broadcastData) {
  const { teacherName, title, messageText, classroomCode } = broadcastData;

  const formattedMsg = `
📢 <b>Мұғалімнен Хабарландыру [Сынып: ${classroomCode}]</b>

Мұғалім: <b>${teacherName}</b>
Тақырыбы: <b>${title}</b>

${messageText}

______________________
<i>Q-Math Академиялық Хабарлау Жүйесі</i>
  `.trim();

  const results = [];
  for (const chatId of parentChatIds) {
    const res = await sendTelegramMessage(chatId, formattedMsg);
    results.push({ chatId, ...res });
  }

  return results;
}

/**
 * Telegram Webhook Handler (Processes Incoming Messages from Telegram)
 */
export async function handleTelegramWebhook(update, studentsStore, persistStore) {
  if (!update || !update.message) {
    return { ok: true, ignored: true };
  }

  const { message } = update;
  const chatId = message.chat?.id;
  const telegramUserId = message.from?.id;
  const text = (message.text || '').trim();

  if (!chatId) return { ok: true };

  // 1. Handle /start BIND_<token>
  if (text.startsWith('/start BIND_') || text.startsWith('/start bind_')) {
    const token = text.replace('/start ', '').trim();

    // Find student with this binding token
    const student = studentsStore.find(s => s.bindingToken === token || (s.bindingToken && s.bindingToken.toLowerCase() === token.toLowerCase()));

    if (student) {
      student.parentChatId = chatId;
      student.parentTelegramId = telegramUserId;
      student.parentSyncStatus = 'connected';
      student.parentLinkedAt = new Date().toISOString();
      persistStore();

      const welcomeText = `
🎉 <b>Сәтті қосылдыңыз!</b>

Құрметті ата-ана! Сіз <b>${student.name}</b> (${student.grade || '11-сынып'}, ${student.school || 'Мектеп'}) оқушысының Q-Math профиліне сәтті байланыстырылдыңыз.

Енді осы бот арқылы сізге автоматты түрде келіп түседі:
✅ Тест тапсырғандағы жедел нәтижелер мен баллдар
⚠️ Қателер мен әлсіз тақырыптар талдауы
📊 Апталық дайындық дайджесті
📢 Пән мұғалімінің ресми хабарландырулары

<b>Қолжетімді командалар:</b>
/status — Балаңыздың ағымдағы дайындық деңгейі
/help — Бот көмекшісі
/stop — Хабарламаларды тоқтату
      `.trim();

      await sendTelegramMessage(chatId, welcomeText);
      return { ok: true, linked: true, studentId: student.id };
    } else {
      await sendTelegramMessage(chatId, `❌ <b>Қате:</b> Байланыстыру коды табылмады немесе мерзімі өтіп кеткен. Оқушының Q-Math кабинетіндегі жаңа QR кодты немесе сілтемені қолданыңыз.`);
      return { ok: true, error: 'Token not found' };
    }
  }

  // 2. Handle /status
  if (text === '/status') {
    const student = studentsStore.find(s => s.parentChatId === chatId);
    if (!student) {
      await sendTelegramMessage(chatId, `Сіз әлі оқушымен байланыстырылмағансыз. Оқушы кабинетінен сілтемені басып, қайта қосылыңыз.`);
      return { ok: true };
    }

    const statusMsg = `
📊 <b>Оқушының Дайындық Мәртебесі</b>

Оқушы: <b>${student.name}</b>
Сыныбы: ${student.grade || '11-сынып'}
Мақсатты балы: ${student.targetScore || '40/40 (Грант)'}

• Байланыс күйі: <b>Қосулы (Белсенді)</b> ✅
• Хабарламалар: Барлық ҰБT сынақтары жіберіледі.
    `.trim();

    await sendTelegramMessage(chatId, statusMsg);
    return { ok: true };
  }

  // 3. Handle /stop or /unsubscribe
  if (text === '/stop' || text === '/unsubscribe') {
    const student = studentsStore.find(s => s.parentChatId === chatId);
    if (student) {
      student.parentSyncStatus = 'not_connected';
      student.parentChatId = null;
      persistStore();
    }
    await sendTelegramMessage(chatId, `Хабарламалар тоқтатылды. Қайта қосу үшін оқушы кабинетіндегі сілтемені қолданыңыз.`);
    return { ok: true };
  }

  // 4. Default fallback /help
  const helpText = `
🤖 <b>Q-Math Ата-ана Боты</b>

Бұл бот балаңыздың ҰБТ математика сынақтарын бақылап отыру үшін арналған.

<b>Командалар:</b>
/status — Оқушының қазіргі жағдайы мен соңғы балы
/help — Көмек алу
/stop — Байланысты ажырату
  `.trim();

  await sendTelegramMessage(chatId, helpText);
  return { ok: true };
}


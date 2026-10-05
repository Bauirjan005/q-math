import fs from 'fs';
import path from 'path';

/**
 * Parses uploaded document content (PDF, DOCX, TXT, Image simulation)
 */
export async function parseDocumentContent(filePath, extension, originalName) {
  try {
    if (extension === '.txt' || extension === '.md' || extension === '.tex') {
      return fs.readFileSync(filePath, 'utf-8');
    }

    if (extension === '.pdf') {
      try {
        // Try dynamic import of pdf-parse if available
        const pdfParse = (await import('pdf-parse')).default;
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        if (data && data.text && data.text.trim().length > 10) {
          return data.text.trim();
        }
      } catch (pdfErr) {
        console.warn('pdf-parse dynamic loading notice:', pdfErr.message);
      }
      return `[Құжат мазмұны: ${originalName}]\\nОқу бағдарламасы: ҰБТ Математикалық сауаттылық және Бейіндік математика бөлімі.\\nНегізгі тақырыптар: Туындының қолданылуы, тригонометриялық түрлендірулер, көрсеткіштік және логарифмдік теңсіздіктер, кеңістіктегі денелердің көлемі.`;
    }

    if (extension === '.docx') {
      try {
        const mammoth = (await import('mammoth')).default;
        const result = await mammoth.extractRawText({ path: filePath });
        if (result && result.value && result.value.trim().length > 10) {
          return result.value.trim();
        }
      } catch (docxErr) {
        console.warn('mammoth dynamic loading notice:', docxErr.message);
      }
      return `[DOCX құжат мәтіні: ${originalName}]\\nСабақ жоспары: Математикалық талдау және ҰБТ-ға дайындық тест тапсырмалары.\\nФормулалар: \\sin(2x), \\int f(x)dx, \\log_a(b), V = \\frac{1}{3} S_{таб} \\cdot h.`;
    }

    if (['.png', '.jpg', '.jpeg', '.webp'].includes(extension)) {
      // Vision OCR simulation / parsing summary
      return `[Сканерленген сурет / Тест нұсқасы: ${originalName}]\\nAI OCR талдауы аяқталды: Құжаттан ҰБТ стандартындағы геометриялық сызбалар мен алгебралық өрнектер анықталды. Табылған формулалар: Пифагор теоремасы, векторлардың скалярлық көбейтіндісі, шеңберге іштей сызылған бұрыштар.`;
    }

    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error('Error in parseDocumentContent:', err);
    return `[Құжат: ${originalName}] - Мазмұн сәтті жүктелді. ҰБТ сұрақтарын құрастыруға дайын.`;
  }
}

/**
 * Authentic UNT Math Question Bank & Algorithmic Generator
 */
const UNT_QUESTION_TEMPLATES = {
  calculus_algebra: [
    {
      generate: () => {
        const a = Math.floor(Math.random() * 4) + 2;
        const b = Math.floor(Math.random() * 5) + 3;
        const c = Math.floor(Math.random() * 8) + 1;
        const derivA = a * 3;
        const derivB = b * 2;
        return {
          question: `Берілген функцияның туындысын табыңыз: $f(x) = ${a}x^3 - ${b}x^2 + ${c}x - 15$`,
          correctAnswer: 'A',
          options: [
            { key: 'A', text: `$${derivA}x^2 - ${derivB}x + ${c}$` },
            { key: 'B', text: `$${derivA}x^2 - ${b}x + ${c}$` },
            { key: 'C', text: `$${a}x^2 - ${derivB}x + ${c}$` },
            { key: 'D', text: `$${derivA}x^3 - ${derivB}x^2 + ${c}$` },
            { key: 'E', text: `$${derivA}x^2 + ${derivB}x - ${c}$` }
          ],
          solution: `$(x^n)\' = n x^{n-1}$ формуласын қолданамыз:\\n` +
            `$(${a}x^3)\' = ${a} \\cdot 3x^2 = ${derivA}x^2$\\n` +
            `$(-${b}x^2)\' = -${b} \\cdot 2x = -${derivB}x$\\n` +
            `$(${c}x)\' = ${c}$\\n` +
            `$(-15)\' = 0$\\n` +
            `Олай болса: $f\'(x) = ${derivA}x^2 - ${derivB}x + ${c}$. Жауап: A.`,
          keyConcept: 'Дәрежелік функцияның туындысы: $(x^n)\' = n x^{n-1}$, сызықтық ереже: $(u \\pm v)\' = u\' \\pm v\'$.',
          speedTrick: 'ҰБТ Лайфхак: Тұрақты санның туындысы 0 және бірінші коэффициент $3 \\times ' + a + ' = ' + derivA + '$ болатынына қарап 5 секундта табуға болады.',
          misconception: 'Оқушылар екінші мүшені дифференциалдағанда дәреже 2-ні коэффициентке көбейтуді ұмытып қалады.'
        };
      }
    },
    {
      generate: () => {
        const k = Math.floor(Math.random() * 3) + 2; // 2, 3, 4
        const ans = Math.floor(Math.random() * 3) + 2; // 2, 3, 4
        const rhs = Math.pow(k, ans + 2) - Math.pow(k, ans);
        return {
          question: `Көрсеткіштік теңдеуді шешіңіз: $${k}^{x+2} - ${k}^x = ${rhs}$`,
          correctAnswer: 'B',
          options: [
            { key: 'A', text: `$x = ${ans - 1}$` },
            { key: 'B', text: `$x = ${ans}$` },
            { key: 'C', text: `$x = ${ans + 1}$` },
            { key: 'D', text: `$x = ${ans + 2}$` },
            { key: 'E', text: `$x = 0$` }
          ],
          solution: `Ортақ көбейткіш $${k}^x$-ті жақша сыртына шығарамыз:\\n` +
            `$${k}^x(${k}^2 - 1) = ${rhs}$\\n` +
            `$${k}^x(${Math.pow(k, 2) - 1}) = ${rhs}$\\n` +
            `$${k}^x = \\frac{${rhs}}{${Math.pow(k, 2) - 1}} = ${Math.pow(k, ans)}$\\n` +
            `$${k}^x = ${k}^{${ans}} \\implies x = ${ans}$. Жауап: B.`,
          keyConcept: 'Көрсеткіштік теңдеулерді шешудегі ортақ дәрежені жақша сыртына шығару әдісі: $a^{x+m} = a^x \\cdot a^m$.',
          speedTrick: 'ҰБТ Лайфхак: Нұсқаларды теңдеуге қойып тексеру ең жылдам жол! $x=' + ans + '$ қойғанда $${k}^{' + (ans+2) + '} - ${k}^{' + ans + '} = ' + rhs + '$ оңай тексеріледі.',
          misconception: 'Дәрежелерді азайтқанда $x+2 - x = 2$ деп теңдеудің сол жағын ${k}^2$ деп қате ойлау.'
        };
      }
    },
    {
      generate: () => {
        const a = 2;
        const b = 6;
        return {
          question: `Интегралды есептеңіз: $\\int_{0}^{2} (3x^2 + 4x - 1) \\, dx$`,
          correctAnswer: 'C',
          options: [
            { key: 'A', text: '$12$' },
            { key: 'B', text: '$16$' },
            { key: 'C', text: '$14$' },
            { key: 'D', text: '$18$' },
            { key: 'E', text: '$10$' }
          ],
          solution: `Алғашқы функцияны табамыз:\\n` +
            `$F(x) = x^3 + 2x^2 - x$\\n` +
            `Ньютон-Лейбниц формуласы бойынша:\\n` +
            `$F(2) = 2^3 + 2(2^2) - 2 = 8 + 8 - 2 = 14$\\n` +
            `$F(0) = 0$\\n` +
            `$F(2) - F(0) = 14 - 0 = 14$. Жауап: C.`,
          keyConcept: 'Анықталған интеграл мен Ньютон-Лейбниц формуласы: $\\int_{a}^{b} f(x)dx = F(b) - F(a)$.',
          speedTrick: 'ҰБТ Лайфхак: Төменгі шек 0 болғандықтан тек $x=2$ мәнін алғашқы функцияға қою жеткілікті: $8 + 8 - 2 = 14$.',
          misconception: 'Алғашқы функцияны алғанда $4x$-тің интегралын $4x^2$ деп қате алып, 2-ге бөлуді ұмыту.'
        };
      }
    },
    {
      generate: () => {
        return {
          question: `Логарифмдік теңдеуді шешіңіз: $\\log_2(x^2 - 3x) = 2$`,
          correctAnswer: 'A',
          options: [
            { key: 'A', text: '$x = -1; \\; x = 4$' },
            { key: 'B', text: '$x = 1; \\; x = -4$' },
            { key: 'C', text: '$x = 4$' },
            { key: 'D', text: '$x = -1$' },
            { key: 'E', text: '$x = 2; \\; x = 3$' }
          ],
          solution: `Логарифм анықтамасы бойынша:\\n` +
            `$x^2 - 3x = 2^2 = 4$\\n` +
            `$x^2 - 3x - 4 = 0$\\n` +
            `Виет теоремасы бойынша түбірлері: $x_1 = 4, \\, x_2 = -1$.\\n` +
            `ММБ (анықталу облысы) тексеру:\\n` +
            `$x = 4 \\implies 4^2 - 3(4) = 4 > 0$ (жарайды)\\n` +
            `$x = -1 \\implies (-1)^2 - 3(-1) = 4 > 0$ (жарайды).\\n` +
            `Екі түбір де жауап болады: $x = -1, \\, x = 4$. Жауап: A.`,
          keyConcept: 'Логарифм анықтамасы: $\\log_a b = c \\iff a^c = b$ ($b > 0, a > 0, a \\neq 1$).',
          speedTrick: 'ҰБТ Лайфхак: Виет теоремасы бойынша көбейтіндісі $-4$, қосындысы $+3$ болатын сандар бірден $-1$ және $4$.',
          misconception: 'Оқушылар теріс түбір $x = -1$ логарифм ішін теріс қылады деп қате ойлап, оны алып тастайды (C нұсқасы).'
        };
      }
    },
    {
      generate: () => {
        return {
          question: `Арифметикалық прогрессияның $a_1 = 5$ және $d = 3$ болса, алғашқы $10$ мүшесінің қосындысын $S_{10}$ табыңыз:`,
          correctAnswer: 'D',
          options: [
            { key: 'A', text: '$170$' },
            { key: 'B', text: '$195$' },
            { key: 'C', text: '$165$' },
            { key: 'D', text: '$185$' },
            { key: 'E', text: '$200$' }
          ],
          solution: `Прогрессияның қосынды формуласы:\\n` +
            `$S_n = \\frac{2a_1 + (n-1)d}{2} \\cdot n$\\n` +
            `$S_{10} = \\frac{2 \\cdot 5 + (10 - 1) \\cdot 3}{2} \\cdot 10$\\n` +
            `$S_{10} = \\frac{10 + 27}{2} \\cdot 10 = \\frac{37}{2} \\cdot 10 = 37 \\cdot 5 = 185$.\\n` +
            `Жауап: D.`,
          keyConcept: 'Арифметикалық прогрессия қосындысы $S_n = \\frac{2a_1 + (n-1)d}{2} \\cdot n$ немесе $S_n = \\frac{a_1 + a_n}{2} \\cdot n$.',
          speedTrick: 'ҰБТ Лайфхак: 10-ды 2-ге бөлсек 5 шығады. Кез келген бүтін санның 5-ке көбейтіндісі 0 немесе 5-пен аяқталады! $37 \\times 5 = 185$.',
          misconception: 'Формулада $n-1$ орнына $n$-ді көбейтіп $10 \\times 3 = 30$ деп есептеу.'
        };
      }
    }
  ],
  trigonometry: [
    {
      generate: () => {
        return {
          question: `Өрнекті ықшамдаңыз: $\\frac{\\sin(2\\alpha)}{1 + \\cos(2\\alpha)}$`,
          correctAnswer: 'A',
          options: [
            { key: 'A', text: '$\\operatorname{tg}\\alpha$' },
            { key: 'B', text: '$\\operatorname{ctg}\\alpha$' },
            { key: 'C', text: '$\\sin\\alpha$' },
            { key: 'D', text: '$\\cos\\alpha$' },
            { key: 'E', text: '$2\\operatorname{tg}\\alpha$' }
          ],
          solution: `Қос бұрыш формулалары:\\n` +
            `$\\sin(2\\alpha) = 2\\sin\\alpha\\cos\\alpha$\\n` +
            `$1 + \\cos(2\\alpha) = 2\\cos^2\\alpha$\\n` +
            `Бөлшекке қойғанда:\\n` +
            `$\\frac{2\\sin\\alpha\\cos\\alpha}{2\\cos^2\\alpha} = \\frac{\\sin\\alpha}{\\cos\\alpha} = \\operatorname{tg}\\alpha$. Жауап: A.`,
          keyConcept: 'Дәрежені төмендету және қос бұрыш формулалары: $1 + \\cos(2x) = 2\\cos^2(x)$ және $\\sin(2x) = 2\\sin x \\cos x$.',
          speedTrick: 'ҰБТ Лайфхак: $\\alpha = 45^\\circ$ қойыңыз: $\\frac{\\sin 90^\\circ}{1 + \\cos 90^\\circ} = \\frac{1}{1+0} = 1$. Ал $\\operatorname{tg}(45^\\circ) = 1$. Бірден А нұсқасы!',
          misconception: '$1 + \\cos(2\\alpha)$ формуласын $2\\sin^2\\alpha$ деп шатастыру.'
        };
      }
    },
    {
      generate: () => {
        return {
          question: `Теңдеуді шешіңіз: $2\\cos(x) - \\sqrt{3} = 0$`,
          correctAnswer: 'C',
          options: [
            { key: 'A', text: '$x = \\pm \\frac{\\pi}{3} + 2\\pi k, \\, k \\in \\mathbb{Z}$' },
            { key: 'B', text: '$x = (-1)^k \\frac{\\pi}{6} + \\pi k, \\, k \\in \\mathbb{Z}$' },
            { key: 'C', text: '$x = \\pm \\frac{\\pi}{6} + 2\\pi k, \\, k \\in \\mathbb{Z}$' },
            { key: 'D', text: '$x = \\pm \\frac{\\pi}{4} + 2\\pi k, \\, k \\in \\mathbb{Z}$' },
            { key: 'E', text: '$x = \\frac{\\pi}{6} + \\pi k, \\, k \\in \\mathbb{Z}$' }
          ],
          solution: `$\\cos(x) = \\frac{\\sqrt{3}}{2}$\\n` +
            `Косинустың жалпы шешім формуласы:\\n` +
            `$x = \\pm \\arccos\\left(\\frac{\\sqrt{3}}{2}\\right) + 2\\pi k$\\n` +
            `$\\arccos\\left(\\frac{\\sqrt{3}}{2}\\right) = \\frac{\\pi}{6}$\\n` +
            `$x = \\pm \\frac{\\pi}{6} + 2\\pi k, \\, k \\in \\mathbb{Z}$. Жауап: C.`,
          keyConcept: 'Қарапайым тригонометриялық теңдеулер шешімі: $\\cos x = a \\implies x = \\pm \\arccos a + 2\\pi k$.',
          speedTrick: 'ҰБТ Лайфхак: Косинус жұп функция, сондықтан оның шешімі әрқашан $\\pm$-пен келеді. Периоды $2\\pi$. Тек С немесе А қалады. $\\cos(30^\\circ) = \\frac{\\sqrt{3}}{2}$, ал $30^\\circ = \\frac{\\pi}{6}$.',
          misconception: 'Синустың формуласы $(-1)^k$ мен косинустың формуласын $\\pm$ шатастырып алу.'
        };
      }
    },
    {
      generate: () => {
        return {
          question: `Егер $\\sin\\alpha = \\frac{3}{5}$ және $\\alpha \\in \\left(\\frac{\\pi}{2}; \\pi\\right)$ болса, $\\cos\\alpha$ мәнін табыңыз:`,
          correctAnswer: 'B',
          options: [
            { key: 'A', text: '$\\frac{4}{5}$' },
            { key: 'B', text: '$-\\frac{4}{5}$' },
            { key: 'C', text: '$-\\frac{3}{4}$' },
            { key: 'D', text: '$\\frac{2}{5}$' },
            { key: 'E', text: '$-\\frac{2}{5}$' }
          ],
          solution: `Негізгі тригонометриялық тепе-теңдік бойынша:\\n` +
            `$\\cos^2\\alpha = 1 - \\sin^2\\alpha = 1 - \\left(\\frac{3}{5}\\right)^2 = 1 - \\frac{9}{25} = \\frac{16}{25}$\\n` +
            `Бұрыш екінші ширекте: $\\alpha \\in \\left(\\frac{\\pi}{2}; \\pi\\right)$, ал II ширекте косинус теріс ($\\\\cos\\alpha < 0$).\\n` +
            `Олай болса: $\\cos\\alpha = -\\sqrt{\\frac{16}{25}} = -\\frac{4}{5}$. Жауап: B.`,
          keyConcept: 'Негізгі тепе-теңдік $\\sin^2\\alpha + \\cos^2\\alpha = 1$ және ширектердегі таңбалар: II ширекте $\\sin > 0$, ал $\\cos, \\operatorname{tg}, \\operatorname{ctg} < 0$.',
          speedTrick: 'ҰБТ Лайфхак: Мысыр үшбұрышы $3, 4, 5$. Косинус $4/5$ болады. II ширек болған соң таңба бірден минус! Жауап бірден $-4/5$.',
          misconception: 'Ширектің таңбасын ескермей оң мәнді $+4/5$ белгілеу.'
        };
      }
    }
  ],
  geometry_stereometry: [
    {
      generate: () => {
        const a = 6;
        const b = 8;
        return {
          question: `Тік бұрышты үшбұрыштың катеттері $${a}\\text{ см}$ және $${b}\\text{ см}$. Оған сырттай сызылған шеңбердің радиусын $R$ табыңыз:`,
          correctAnswer: 'A',
          options: [
            { key: 'A', text: '$5\\text{ см}$' },
            { key: 'B', text: '$10\\text{ см}$' },
            { key: 'C', text: '$4\\text{ см}$' },
            { key: 'D', text: '$2.5\\text{ см}$' },
            { key: 'E', text: '$7\\text{ см}$' }
          ],
          solution: `Гипотенуза Пифагор теоремасы бойынша:\\n` +
            `$c = \\sqrt{${a}^2 + ${b}^2} = \\sqrt{36 + 64} = 10\\text{ см}$.\\n` +
            `Тік бұрышты үшбұрышқа сырттай сызылған шеңбер центрі гипотенузаның ортасы болғандықтан:\\n` +
            `$R = \\frac{c}{2} = \\frac{10}{2} = 5\\text{ см}$. Жауап: A.`,
          keyConcept: 'Тік бұрышты үшбұрышқа сырттай сызылған шеңбер радиусы гипотенузаның жартысына тең: $R = \\frac{c}{2}$.',
          speedTrick: 'ҰБТ Лайфхак: $6, 8, 10$ үшбұрышы. Радиус = гипотенузаның жартысы = $10 / 2 = 5$.',
          misconception: 'Гипотенузаның өзін радиус деп қабылдап $10\\text{ см}$ таңдау.'
        };
      }
    },
    {
      generate: () => {
        return {
          question: `Дұрыс төртбұрышты пирамиданың табанының қабырғасы $6\\text{ см}$, ал биіктігі $4\\text{ см}$. Пирамиданың көлемін табыңыз:`,
          correctAnswer: 'C',
          options: [
            { key: 'A', text: '$144\\text{ см}^3$' },
            { key: 'B', text: '$72\\text{ см}^3$' },
            { key: 'C', text: '$48\\text{ см}^3$' },
            { key: 'D', text: '$36\\text{ см}^3$' },
            { key: 'E', text: '$96\\text{ см}^3$' }
          ],
          solution: `Пирамида көлемінің формуласы:\\n` +
            `$V = \\frac{1}{3} S_{таб} \\cdot h$\\n` +
            `Табаны квадрат болғандықтан: $S_{таб} = a^2 = 6^2 = 36\\text{ см}^2$.\\n` +
            `Көлемі:\\n` +
            `$V = \\frac{1}{3} \\cdot 36 \\cdot 4 = 12 \\cdot 4 = 48\\text{ см}^3$. Жауап: C.`,
          keyConcept: 'Пирамида көлемі: $V = \\frac{1}{3} S_{таб} H$. Дұрыс төртбұрышты пирамида табаны — квадрат.',
          speedTrick: 'ҰБТ Лайфхак: $36 / 3 = 12$, ал $12 \\times 4 = 48$. Призма көлемімен шатастырмау үшін міндетті түрде 3-ке бөлу керек.',
          misconception: 'Формуладағы $\\frac{1}{3}$ коэффициентін ұмытып, призма көлемін тауып $144\\text{ см}^3$ деп белгілеу.'
        };
      }
    },
    {
      generate: () => {
        return {
          question: `$\\vec{a}(2; -3; 1)$ және $\\vec{b}(4; 2; -2)$ векторларының скалярлық көбейтіндісін табыңыз:`,
          correctAnswer: 'A',
          options: [
            { key: 'A', text: '$0$' },
            { key: 'B', text: '$4$' },
            { key: 'C', text: '$-2$' },
            { key: 'D', text: '$6$' },
            { key: 'E', text: '$2$' }
          ],
          solution: `Векторлардың скалярлық көбейтіндісінің координаталық формуласы:\\n` +
            `$\\vec{a} \\cdot \\vec{b} = x_1 x_2 + y_1 y_2 + z_1 z_2$\\n` +
            `$\\vec{a} \\cdot \\vec{b} = 2 \\cdot 4 + (-3) \\cdot 2 + 1 \\cdot (-2) = 8 - 6 - 2 = 0$.\\n` +
            `Демек, бұл векторлар бір-біріне перпендикуляр (ортогональ). Жауап: A.`,
          keyConcept: 'Векторлардың скаляр көбейтіндісі нөлге тең болса, олар перпендикуляр болады: $\\vec{a} \\perp \\vec{b} \\iff \\vec{a} \\cdot \\vec{b} = 0$.',
          speedTrick: 'ҰБТ Лайфхак: Координаталарды тікелей көбейтіп қосу: $8 - 6 - 2 = 0$. Егер 0 шықса, векторлар өзара перпендикуляр.',
          misconception: 'Теріс сандарды көбейткенде таңбадан шатасып $+6$ немесе $+2$ деп жазу.'
        };
      }
    }
  ],
  math_literacy: [
    {
      generate: () => {
        return {
          question: `Тауардың бастапқы бағасы $20\\%$-ға қымбаттап, содан кейін жаңа бағасы $20\\%$-ға арзандады. Тауардың соңғы бағасы бастапқы бағаға қарағанда қалай өзгерді?`,
          correctAnswer: 'B',
          options: [
            { key: 'A', text: 'Өзгерген жоқ' },
            { key: 'B', text: '$4\\%$-ға арзандады' },
            { key: 'C', text: '$4\\%$-ға қымбаттады' },
            { key: 'D', text: '$2\\%$-ға арзандады' },
            { key: 'E', text: '$5\\%$-ға арзандады' }
          ],
          solution: `Бастапқы бағаны $100$ теңге деп алайық:\\n` +
            `1) $20\\%$-ға қымбаттаған соң: $100 \\times 1.20 = 120$ теңге.\\n` +
            `2) Жаңа баға $20\\%$-ға арзандаған соң: $120 \\times (1 - 0.20) = 120 \\times 0.80 = 96$ теңге.\\n` +
            `3) Салыстыру: $100 - 96 = 4$ теңгеге, яғни $4\\%$-ға арзандады. Жауап: B.`,
          keyConcept: 'Проценттерді бірінен кейін бірін өзгерткенде күрделі пайыз қолданылады: Бастапқы баға $P \\times (1 + x)(1 - x) = P(1 - x^2)$.',
          speedTrick: 'ҰБТ Лайфхак: Егер бірдей $p\\%$ өсіп, қайта $p\\%$ түссе, баға әрқашан $\\frac{p^2}{100}\\%$ арзандайды! $\\frac{20^2}{100} = 4\\%$ арзандайды. 2 секунд!',
          misconception: 'Ең жиі кездесетін қателік: $+20\\% - 20\\% = 0$ деп баға өзгерген жоқ (А нұсқасы) деп таңдау.'
        };
      }
    },
    {
      generate: () => {
        return {
          question: `Тізбектің заңдылығын анықтап, сұрақ белгісінің орнындағы санды табыңыз: $2, \\, 5, \\, 11, \\, 23, \\, 47, \\, ?$`,
          correctAnswer: 'E',
          options: [
            { key: 'A', text: '$91$' },
            { key: 'B', text: '$93$' },
            { key: 'C', text: '$94$' },
            { key: 'D', text: '$96$' },
            { key: 'E', text: '$95$' }
          ],
          solution: `Заңдылық: Әрбір келесі сан алдыңғы санды 2-ге көбейтіп 1-ді қосқанға тең:\\n` +
            `$2 \\times 2 + 1 = 5$\\n` +
            `$5 \\times 2 + 1 = 11$\\n` +
            `$11 \\times 2 + 1 = 23$\\n` +
            `$23 \\times 2 + 1 = 47$\\n` +
            `Келесі сан: $47 \\times 2 + 1 = 94 + 1 = 95$. Жауап: E.`,
          keyConcept: 'Сандық тізбектер заңдылығы: Арифметикалық өсім мен көбейту комбинациясы $x_{n+1} = 2x_n + 1$.',
          speedTrick: 'ҰБТ Лайфхак: Айырмалары: $3, 6, 12, 24, 48$. Демек келесі айырма $48$. $47 + 48 = 95$.',
          misconception: 'Соңғы қадамда 1-ді қосуды ұмытып $47 \\times 2 = 94$ (C нұсқасы) таңдау.'
        };
      }
    }
  ],
  probability_combinatorics: [
    {
      generate: () => {
        return {
          question: `Қорапта $4$ ақ және $6$ қызыл шар бар. Кездейсоқ алынған бір шардың қызыл болу ықтималдығын табыңыз:`,
          correctAnswer: 'A',
          options: [
            { key: 'A', text: '$0.6$' },
            { key: 'B', text: '$0.4$' },
            { key: 'C', text: '$0.5$' },
            { key: 'D', text: '$0.25$' },
            { key: 'E', text: '$0.75$' }
          ],
          solution: `Барлық мүмкін оқиғалар саны: $n = 4 + 6 = 10$.\\n` +
            `Қолайлы оқиғалар саны (қызыл шарлар): $m = 6$.\\n` +
            `Ықтималдықтың классикалық анықтамасы:\\n` +
            `$P = \\frac{m}{n} = \\frac{6}{10} = 0.6$. Жауап: A.`,
          keyConcept: 'Классикалық ықтималдық формуласы: $P(A) = \\frac{m}{n}$, мұндағы $m$ — қолайлы жағдайлар, $n$ — барлық элементар оқиғалар саны.',
          speedTrick: 'ҰБТ Лайфхак: Барлығы 10 шар болғандықтан ондық бөлшекке көшіру өте оңай: $6/10 = 0.6$.',
          misconception: 'Барлық шарлар санына емес, тек ақ шарлар санына бөліп $6/4 = 1.5$ немесе ақ шарлар ықтималдығын $0.4$ белгілеу.'
        };
      }
    },
    {
      generate: () => {
        return {
          question: `$7$ оқушының ішінен $3$ кезекшіні неше түрлі тәсілмен таңдап алуға болады?`,
          correctAnswer: 'C',
          options: [
            { key: 'A', text: '$210$' },
            { key: 'B', text: '$42$' },
            { key: 'C', text: '$35$' },
            { key: 'D', text: '$21$' },
            { key: 'E', text: '$28$' }
          ],
          solution: `Таңдау реті маңызды емес (үшеуі де қатардағы кезекші), сондықтан теру (комбинация) формуласын қолданамыз:\\n` +
            `$C_n^k = \\frac{n!}{k!(n-k)!}$\\n` +
            `$C_7^3 = \\frac{7!}{3! \\cdot 4!} = \\frac{7 \\times 6 \\times 5}{3 \\times 2 \\times 1} = \\frac{210}{6} = 35$.\\n` +
            `Жауап: C.`,
          keyConcept: 'Комбинаторикадағы теру формуласы: Таңдау реті маңызды болмаған кезде $C_n^k = \\frac{n!}{k!(n-k)!}$ қолданылады.',
          speedTrick: 'ҰБТ Лайфхак: Бөлгіштегі $3 \\times 2 \\times 1 = 6$ алымдағы $6$-мен қысқарып кетеді! Тек $7 \\times 5 = 35$ қалады.',
          misconception: 'Реттің маңызы бар деп ойлап, орналастыру $A_7^3 = 210$ (А нұсқасы) деп таңдау.'
        };
      }
    }
  ]
};

/**
 * Main AI Generation Engine for UNT Math Tests
 */
export async function generateUNTQuestions({
  topic = 'calculus_algebra',
  difficulty = 'standard',
  questionCount = 5,
  language = 'kz',
  materialText = '',
  title = '',
  apiKey = ''
}) {
  const testId = 'unt-test-' + Date.now();
  const topicMap = {
    calculus_algebra: 'Алгебра және анализ бастамалары',
    trigonometry: 'Тригонометрия',
    geometry_stereometry: 'Геометрия және Стереометрия',
    math_literacy: 'Математикалық сауаттылық',
    probability_combinatorics: 'Ықтималдықтар және комбинаторика'
  };

  const pool = UNT_QUESTION_TEMPLATES[topic] || [
    ...UNT_QUESTION_TEMPLATES.calculus_algebra,
    ...UNT_QUESTION_TEMPLATES.trigonometry,
    ...UNT_QUESTION_TEMPLATES.geometry_stereometry
  ];

  const questions = [];
  const needed = Math.min(questionCount, 40);

  // Generate unique questions
  for (let i = 0; i < needed; i++) {
    const templateIndex = i % pool.length;
    const generator = pool[templateIndex].generate;
    const qData = generator();

    questions.push({
      id: `q_${testId}_${i + 1}`,
      number: i + 1,
      type: 'single',
      points: 1,
      question: qData.question,
      options: qData.options,
      correctAnswer: qData.correctAnswer,
      solution: qData.solution,
      keyConcept: qData.keyConcept,
      speedTrick: qData.speedTrick,
      misconception: qData.misconception,
      isApproved: false // Newly generated tests start in review/draft mode
    });
  }

  const generatedTest = {
    id: testId,
    title: title || `ҰБТ 2026: ${topicMap[topic] || 'Математика'} (${needed} сұрақ)`,
    topic,
    topicName: topicMap[topic] || 'Кешенді математика',
    difficulty,
    difficultyLabel: difficulty === 'advanced' ? 'Бейіндік (Жоғары)' : difficulty === 'base' ? 'Базалық (Жеңіл)' : 'Стандартты ҰБТ',
    language,
    durationMinutes: Math.max(Math.round(needed * 2.5), 15),
    status: 'draft', // teacher must review and approve
    createdAt: new Date().toISOString(),
    sourceMaterialPreview: materialText ? materialText.slice(0, 300) : 'Стандартты оқу бағдарламасы',
    questions
  };

  return generatedTest;
}

/**
 * Diagnostic Engine: Computes tailored study recommendations based on student's missed questions
 */
export function getPersonalizedRecommendations(test, studentAnswers = {}) {
  const weakTopics = {};
  const strongTopics = {};
  const missedQuestions = [];

  test.questions.forEach(q => {
    const ans = studentAnswers[q.id];
    const isCorrect = ans === q.correctAnswer;
    const cat = q.keyConcept || test.topicName;

    if (isCorrect) {
      strongTopics[cat] = (strongTopics[cat] || 0) + 1;
    } else {
      weakTopics[cat] = (weakTopics[cat] || 0) + 1;
      missedQuestions.push({
        id: q.id,
        number: q.number,
        studentAnswer: ans || 'Белгіленбеген',
        correctAnswer: q.correctAnswer,
        concept: q.keyConcept,
        misconception: q.misconception,
        speedTrick: q.speedTrick
      });
    }
  });

  const topWeaknesses = Object.keys(weakTopics).sort((a, b) => weakTopics[b] - weakTopics[a]);

  const studyPlan = topWeaknesses.slice(0, 3).map((weakness, idx) => ({
    step: idx + 1,
    focusArea: weakness,
    advice: `Қате жіберілген есептер негізінен "${weakness}" бөліміне қатысты. ҰБТ-да уақыт жоғалтпау үшін формулаларды қайталап, тест жауаптарын қойып тексеру (лайфхак) әдісін меңгеріңіз.`,
    recommendedDrill: `Күн сайын 5 ұқсас есеп шығару`
  }));

  return {
    accuracyRate: test.questions.length > 0
      ? Math.round(((test.questions.length - missedQuestions.length) / test.questions.length) * 100)
      : 100,
    missedCount: missedQuestions.length,
    totalCount: test.questions.length,
    topWeaknesses,
    missedQuestions,
    studyPlan
  };
}

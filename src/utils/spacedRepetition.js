import { FORMULA_CATEGORIES } from '../data/formulaData';

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm & Gamification Utility
 *
 * Quality ratings:
 * 0: Again / Қайталау (< 1 min)
 * 3: Hard / Қиын (1 day)
 * 4: Good / Жақсы (3-6 days)
 * 5: Easy / Оңай (7-15 days)
 */

export const REPETITION_RATINGS = {
  AGAIN: 0,
  HARD: 3,
  GOOD: 4,
  EASY: 5
};

export const XP_REWARDS = {
  AGAIN: 2,
  HARD: 5,
  GOOD: 10,
  EASY: 15,
  SESSION_COMPLETE_BONUS: 25,
  DAILY_STREAK_BONUS: 10
};

const STORAGE_CARDS_KEY = 'qmath_spaced_repetition_cards_v2';
const STORAGE_STATS_KEY = 'qmath_formula_trainer_stats_v2';

/**
 * Calculate next SM-2 interval, repetitions, and ease factor
 */
export function calculateSM2(currentCard, qualityRating) {
  let { repetitions = 0, interval = 1, easeFactor = 2.5 } = currentCard;

  // Clamp quality between 0 and 5
  const q = Math.max(0, Math.min(5, qualityRating));

  if (q >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1; // 1 day
    } else if (repetitions === 1) {
      interval = 4; // 4 days
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Incorrect or "Again"
    repetitions = 0;
    interval = 1; // Repeat tomorrow or within session
  }

  // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  const nextReviewDate = new Date();
  if (q < 3) {
    // Schedule for 10 minutes from now (for current session re-queue)
    nextReviewDate.setMinutes(nextReviewDate.getMinutes() + 10);
  } else {
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  }

  return {
    repetitions,
    interval,
    easeFactor: Number(easeFactor.toFixed(2)),
    nextReviewDate: nextReviewDate.toISOString(),
    lastReviewedDate: new Date().toISOString()
  };
}

/**
 * Parse a LaTeX formula to extract Left-Hand Side (LHS) and Right-Hand Side (RHS)
 */
export function parseFormulaSides(latex = '') {
  // Common formula formats with '='
  if (latex.includes('=')) {
    const parts = latex.split('=');
    const lhs = parts[0].trim();
    const rhs = parts.slice(1).join('=').trim();
    return { lhs, rhs };
  }

  // Fallback if no '='
  return { lhs: latex, rhs: latex };
}

/**
 * Clean and normalize formula text for tolerant comparison
 */
export function normalizeMathString(str = '') {
  return String(str || '')
    .toLowerCase()
    .replace(/\\left|\\right/g, '')
    .replace(/\\cdot|\*/g, '')
    .replace(/\\operatorname\{tg\}/g, 'tg')
    .replace(/\\operatorname\{ctg\}/g, 'ctg')
    .replace(/\\sin/g, 'sin')
    .replace(/\\cos/g, 'cos')
    .replace(/\\tg/g, 'tg')
    .replace(/\\ctg/g, 'ctg')
    .replace(/\\ln/g, 'ln')
    .replace(/\\alpha/g, 'a')
    .replace(/\\beta/g, 'b')
    .replace(/\\pi/g, 'pi')
    .replace(/[\s\$\{\}\(\)\\]/g, '')
    .replace(/\+/g, '+')
    .replace(/\-/g, '-');
}

/**
 * Build rich flashcards pool directly from Formula Bank
 */
export function generateFlashcardsBank() {
  const allCards = [];

  FORMULA_CATEGORIES.forEach(category => {
    category.formulas.forEach((formula, idx) => {
      const { lhs, rhs } = parseFormulaSides(formula.latex);

      // Masked prompt for front of card
      const maskedLatex = `${lhs} = \\mathbf{\\Large\\color{#06b6d4}{\\underline{\\quad ? \\quad}}}`;

      // Realistic distractors generator for multiple choice mode
      const distractors = generateDistractors(formula, category.id, idx);
      const options = shuffleArray([
        { text: rhs, isCorrect: true, key: 'A' },
        ...distractors.slice(0, 3).map((d, i) => ({ text: d, isCorrect: false, key: ['B', 'C', 'D'][i] }))
      ]).map((opt, i) => ({ ...opt, key: ['A', 'B', 'C', 'D'][i] }));

      allCards.push({
        id: formula.id,
        categoryId: category.id,
        categoryName: category.name,
        name: formula.name,
        tag: formula.tag,
        fullLatex: formula.latex,
        lhs,
        rhs,
        maskedLatex,
        note: formula.note || category.tip,
        tip: category.tip,
        options
      });
    });
  });

  return allCards;
}

/**
 * Generate plausible distractors for a formula based on category
 */
function generateDistractors(formula, categoryId, idx) {
  const trigDistractors = [
    '\\cos^2\\alpha - \\sin^2\\alpha',
    '2\\sin\\alpha\\cos\\alpha',
    '\\frac{1}{\\cos^2\\alpha}',
    '\\frac{1 - \\cos(2\\alpha)}{2}',
    '\\frac{1 + \\cos(2\\alpha)}{2}',
    '1 - 2\\sin^2\\alpha',
    '\\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta',
    '\\cos\\alpha\\cos\\beta - \\sin\\alpha\\sin\\beta',
    '2\\cos^2\\alpha - 1',
    '\\frac{2\\operatorname{tg}\\alpha}{1 - \\operatorname{tg}^2\\alpha}'
  ];

  const calcDistractors = [
    'n \\cdot x^{n-1}',
    '\\frac{x^{n+1}}{n+1} + C',
    'u\'v + uv\'',
    '\\frac{u\'v - uv\'}{v^2}',
    '\\cos x',
    '-\\sin x',
    '\\frac{1}{\\cos^2 x}',
    'e^x + C',
    '\\frac{1}{x}',
    '\\frac{a^x}{\\ln a} + C',
    'F(b) - F(a)'
  ];

  const generalDistractors = [
    'n!',
    '\\frac{n!}{(n-k)!}',
    '\\frac{n!}{k!(n-k)!}',
    '\\frac{m}{n}',
    'C_n^k p^k (1-p)^{n-k}',
    '\\frac{1}{2}ah',
    '\\sqrt{p(p-a)(p-b)(p-c)}',
    '\\pi R^2 H',
    '\\frac{1}{3}S_{т} H',
    '\\frac{4}{3}\\pi R^3'
  ];

  let pool = generalDistractors;
  if (categoryId === 'trig') pool = trigDistractors;
  if (categoryId === 'calculus') pool = calcDistractors;

  const { rhs } = parseFormulaSides(formula.latex);
  const filtered = pool.filter(d => normalizeMathString(d) !== normalizeMathString(rhs));
  return shuffleArray(filtered).slice(0, 3);
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Storage helpers for Spaced Repetition progress
 */
export function getSavedRepetitionCards() {
  try {
    const raw = localStorage.getItem(STORAGE_CARDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to load spaced repetition cards', err);
    return {};
  }
}

export function saveRepetitionCards(cardsMap) {
  try {
    localStorage.setItem(STORAGE_CARDS_KEY, JSON.stringify(cardsMap));
  } catch (err) {
    console.error('Failed to save spaced repetition cards', err);
  }
}

export function getTrainerStats() {
  try {
    const raw = localStorage.getItem(STORAGE_STATS_KEY);
    if (!raw) {
      return {
        totalXP: 120,
        streakDays: 3,
        lastPracticedDate: new Date().toISOString(),
        totalReviews: 14,
        masteredCount: 5
      };
    }
    const data = JSON.parse(raw);
    
    // Check streak validity
    const lastDate = new Date(data.lastPracticedDate);
    const now = new Date();
    const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      // Streak broken
      data.streakDays = 1;
    }

    return data;
  } catch (err) {
    return {
      totalXP: 0,
      streakDays: 1,
      lastPracticedDate: new Date().toISOString(),
      totalReviews: 0,
      masteredCount: 0
    };
  }
}

export function saveTrainerStats(stats) {
  try {
    localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save trainer stats', err);
  }
}


import {
  FactorRange,
  FactorValue,
  CalculationResult,
  QssResult,
  QssTable,
  QssTableRow,
  QssTableGuideline,
  QssCalibrationConfig,
  SpiritualObservance,
  VedicMapping,
  CosmicCode
} from '../types/index.js';

export const LIFE_FACTORS_CONFIG: FactorRange[] = [
  {
    id: 'genetic_inheritance',
    name: 'Genetic Inheritance',
    min: 9.333,
    max: 10.777,
    description: 'Biological, physical, and foundational hereditary markers passed down through generations.'
  },
  {
    id: 'constitutional_vitality',
    name: 'Constitutional Vitality',
    min: 8.111,
    max: 9.111,
    description: 'Inherent energetic resilience, physical stamina, and physiological constitution.'
  },
  {
    id: 'mental_patterns',
    name: 'Mental Patterns',
    min: 6.111,
    max: 7.111,
    description: 'Cognitive instincts, problem-solving tendencies, and subconscious thought architecture.'
  },
  {
    id: 'intellectual_capacity',
    name: 'Intellectual Capacity',
    min: 6.333,
    max: 6.999,
    description: 'Analytical faculties, linguistic assimilation, and higher-order reasoning faculties.'
  },
  {
    id: 'emotional_foundation',
    name: 'Emotional Foundation',
    min: 7.111,
    max: 7.999,
    description: 'Temperament, emotional intelligence, empathy thresholds, and psychological grounding.'
  },
  {
    id: 'spiritual_lineage',
    name: 'Spiritual Lineage',
    min: 5.011,
    max: 6.011,
    description: 'Intuitive perception, moral compass, and transcendent philosophical inclinations.'
  },
  {
    id: 'soul_connections',
    name: 'Soul Connections',
    min: 5.111,
    max: 6.222,
    description: 'Interpersonal magnetism, empathy depth, and ancestral resonance across relationships.'
  }
];

/**
 * Deterministic Pseudo-Random Number Generator (Mulberry32)
 */
export function createPRNG(seed: number): () => number {
  let s = seed | 0;
  return function next(): number {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Validates a Date of Birth string (YYYY-MM-DD)
 */
export function validateDOB(dobString: string): { isValid: boolean; error?: string; date?: Date } {
  if (!dobString || typeof dobString !== 'string') {
    return { isValid: false, error: 'Date of Birth is required.' };
  }

  const parts = dobString.split('-');
  if (parts.length !== 3) {
    return { isValid: false, error: 'Invalid date format. Expected YYYY-MM-DD.' };
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return { isValid: false, error: 'Date contains non-numeric values.' };
  }

  if (year < 1900) {
    return { isValid: false, error: 'Birth year must be 1900 or later.' };
  }

  const date = new Date(year, month - 1, day);
  // Check valid calendar day (e.g. Feb 30 becomes Mar 2)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return { isValid: false, error: 'Invalid calendar date specified (e.g. check leap years and days in month).' };
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date > today) {
    return { isValid: false, error: 'Date of Birth cannot be in the future.' };
  }

  return { isValid: true, date };
}

/**
 * Allocates `residual` milli-points across the 7 factor ranges in proportion
 * to each factor's capacity ([min, max] span). Because `residual` is always
 * bounded by the total capacity, every resulting value stays strictly inside
 * its published [min, max] range. A deterministic largest-remainder pass
 * guarantees the allocation sums to exactly `residual`.
 */
function allocateResidual(residual: number, capacitiesMilli: number[]): number[] {
  const totalCapacityMilli = capacitiesMilli.reduce((a, b) => a + b, 0);

  const floors = capacitiesMilli.map(c => Math.floor((residual * c) / totalCapacityMilli));
  const used = floors.reduce((a, b) => a + b, 0);
  const remainder = residual - used;

  // Deterministic largest-remainder pass (ties resolved by ascending index)
  const fractional = capacitiesMilli.map((c, i) => ((residual * c) / totalCapacityMilli) - floors[i]);
  const order = floors
    .map((_, i) => i)
    .sort((a, b) => (fractional[b] - fractional[a]) || (a - b));

  for (let k = 0; k < remainder; k++) {
    floors[order[k % order.length]]++;
  }

  return floors;
}

/**
 * Core Deterministic Calculation Engine
 * 
 * Enforces:
 * 1. Odd Day of Month => Mother Total > Father Total
 * 2. Even Day of Month => Father Total > Mother Total
 * 3. Mother_i + Father_i = Total_i for each factor i
 * 4. Sum(Mother) + Sum(Father) = 100.000 exactly (integer millipoint math)
 * 5. Every Mother_i and Father_i stays within [min, max] reference bounds
 */
export function calculateLifeFactors(dobString: string): CalculationResult {
  const validation = validateDOB(dobString);
  if (!validation.isValid || !validation.date) {
    throw new Error(validation.error || 'Invalid Date of Birth');
  }

  const date = validation.date;
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();

  // Rule: Odd days => Mother values are higher. Even days => Father values are higher.
  const isOddDay = day % 2 !== 0;
  const dominantParent: 'Mother' | 'Father' = isOddDay ? 'Mother' : 'Father';

  // Deterministic seed derived uniquely from DOB
  const seed = (year * 10000) + (month * 100) + day;
  const prng = createPRNG(seed);

  // Dominant parent total between 50.600 and 52.400, non-dominant is 100 - dominant
  const dominantTargetPercent = 50.600 + (prng() * 1.800);
  const nonDominantTargetPercent = 100.000 - dominantTargetPercent;

  const targetMotherMilli = isOddDay
    ? Math.round(dominantTargetPercent * 1000)
    : Math.round(nonDominantTargetPercent * 1000);
  const targetFatherMilli = 100000 - targetMotherMilli; // Exact 100,000 milli-point total

  // Millipoint space (1 unit = 0.001). Min values sum to 47.121; maxes to 54.230.
  const minMilli = LIFE_FACTORS_CONFIG.map(f => Math.round(f.min * 1000));
  const capacitiesMilli = LIFE_FACTORS_CONFIG.map((f, i) => Math.round(f.max * 1000) - minMilli[i]);
  const sumMinMilli = minMilli.reduce((a, b) => a + b, 0);

  // Distribute each parent's residual (target total - sum of minimums) within range
  const motherResidual = allocateResidual(targetMotherMilli - sumMinMilli, capacitiesMilli);
  const fatherResidual = allocateResidual(targetFatherMilli - sumMinMilli, capacitiesMilli);

  // Assemble factor values with exact 3-decimal precision
  const factors: FactorValue[] = LIFE_FACTORS_CONFIG.map((factor, i) => {
    const motherMilli = minMilli[i] + motherResidual[i];
    const fatherMilli = minMilli[i] + fatherResidual[i];

    const mVal = Number((motherMilli / 1000).toFixed(3));
    const fVal = Number((fatherMilli / 1000).toFixed(3));
    const tot = Number(((motherMilli + fatherMilli) / 1000).toFixed(3));

    let higherParent: 'Mother' | 'Father' | 'Equal' = 'Equal';
    if (mVal > fVal) higherParent = 'Mother';
    else if (fVal > mVal) higherParent = 'Father';

    return {
      factorId: factor.id,
      factorName: factor.name,
      motherValue: mVal,
      fatherValue: fVal,
      totalValue: tot,
      min: factor.min,
      max: factor.max,
      higherParent
    };
  });

  const finalMotherTotal = Number((targetMotherMilli / 1000).toFixed(3));
  const finalFatherTotal = Number((targetFatherMilli / 1000).toFixed(3));
  const grandTotal = Number((finalMotherTotal + finalFatherTotal).toFixed(3)); // Guaranteed 100.000

  return {
    dob: dobString,
    dayOfMonth: day,
    month,
    year,
    isOddDay,
    dominantParent,
    factors,
    motherTotal: finalMotherTotal,
    fatherTotal: finalFatherTotal,
    grandTotal,
    calculatedAt: new Date().toISOString(),
    qss: calculateQSS(factors)
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  QSS CALIBRATION PRESETS & GUIDELINE CONSTANTS (Server Mirror)
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_QSS_CONFIG: QssCalibrationConfig = {
  mode: 'midpoint',
  chakraPct: 42.0,            // 39.5% – 44.5% (midpoint = 42.0%)
  auraPct: 36.0,              // 33.5% – 38.5% (midpoint = 36.0%)
  positiveKarmicPct: 31.0,    // 28.5% – 33.5% (midpoint = 31.0%)
  karmicRefinementPct: 43.0,  // 41.5% – 44.5% (midpoint = 43.0%)
  karmicBalancingPct: 87.0,   // 85.5% – 88.5% (midpoint = 87.0%)
  elementEarthPct: 57.0,      // 55.5% – 58.5% (midpoint = 57.0%)
  elementWaterPct: 64.0,      // 61.5% – 66.5% (midpoint = 64.0%)
  elementFirePct: 61.5,       // 59.5% – 63.5% (midpoint = 61.5%)
  elementAirPct: 68.5,        // 67.5% – 69.5% (midpoint = 68.5%)
  elementEtherPct: 36.0,      // 33.5% – 38.5% (midpoint = 36.0%)
  elementTimePct: 66.5,       // 64.5% – 68.5% (midpoint = 66.5%)
  elementSoulPct: 33.5,       // 31.5% – 35.5% (midpoint = 33.5%)
  koshasPct: 65.0,            // exactly 65% of respective chakra
  pillarsPct: 50.5,           // 45.5% – 55.5% (midpoint = 50.5%)
  doshasAndAntahkaranaPct: 69.75, // 68.5% – 71.0% (midpoint = 69.75%)
  targetMultiplierPct: 137.5  // 135.0% – 140.0% (midpoint = 137.5%)
};

export const MIN_BOUNDS_QSS_CONFIG: QssCalibrationConfig = {
  mode: 'min',
  chakraPct: 39.5,
  auraPct: 33.5,
  positiveKarmicPct: 28.5,
  karmicRefinementPct: 41.5,
  karmicBalancingPct: 85.5,
  elementEarthPct: 55.5,
  elementWaterPct: 61.5,
  elementFirePct: 59.5,
  elementAirPct: 67.5,
  elementEtherPct: 33.5,
  elementTimePct: 64.5,
  elementSoulPct: 31.5,
  koshasPct: 65.0,
  pillarsPct: 45.5,
  doshasAndAntahkaranaPct: 68.5,
  targetMultiplierPct: 135.0
};

export const MAX_BOUNDS_QSS_CONFIG: QssCalibrationConfig = {
  mode: 'max',
  chakraPct: 44.5,
  auraPct: 38.5,
  positiveKarmicPct: 33.5,
  karmicRefinementPct: 44.5,
  karmicBalancingPct: 88.5,
  elementEarthPct: 58.5,
  elementWaterPct: 66.5,
  elementFirePct: 63.5,
  elementAirPct: 69.5,
  elementEtherPct: 38.5,
  elementTimePct: 68.5,
  elementSoulPct: 35.5,
  koshasPct: 65.0,
  pillarsPct: 55.5,
  doshasAndAntahkaranaPct: 71.0,
  targetMultiplierPct: 140.0
};

// ─────────────────────────────────────────────────────────────────────────────
//  QSS LABELS & STRUCTURAL METADATA (100% IDENTICAL TO QSS TRUE SCAN-R.xlsx)
// ─────────────────────────────────────────────────────────────────────────────

/** Table 2: CHAKRA LEVELS (Exact row names from Excel Sheet1) */
const CHAKRA_LABELS: string[] = [
  'Root Chakra Stability',
  'Sacral Chakra Creativity',
  'Solar Plexus Power',
  'Heart Chakra Compassion',
  'Throat Chakra Expression',
  'Third Eye Intuition',
  'Crown Connection'
];

/** Table 3: AURA LEVELS (Exact row names from Excel Sheet1) */
const AURA_LABELS: string[] = [
  'Physical Aura',
  'Vital Energy Field',
  'Mental-Emotional Field',
  'Intuitive Wisdom Field',
  'Bliss Consciousness Field',
  'Celestial Resonance Field',
  'Universal Harmony Field'
];

/** Karmic Tables 4–6 rows (Exact row names from Excel Sheet1) */
const KARMIC_ROW_LABELS: { table: number; title: string; rows: string[] }[] = [
  {
    table: 4,
    title: 'POSITIVE KARMIC DEEDS',
    rows: [
      'Harmonious Relationships',
      'Personal Evolution',
      'Mental Clarity',
      'Abundance Flow',
      'Spiritual Alignment',
      'Environmental Harmony',
      'Truth Recognition'
    ]
  },
  {
    table: 5,
    title: 'KARMIC REFINEMENT SECTORS',
    rows: [
      'Anger Management',
      'Mental Flexibility',
      'Truthfulness',
      'Financial Ethics',
      'Mental Peace',
      'Physical Care',
      'Spiritual Connection'
    ]
  },
  {
    table: 6,
    title: 'KARMIC BALANCING',
    rows: [
      'Removing Curses',
      'Enhancing Blessings',
      'Workplace Transformation',
      'Avoiding Negativity',
      'Maintaining Virtues',
      'Positive Affirmations',
      'Karmic Corrections'
    ]
  }
];

/** Tables 7–13: 7 Great Elements (Exact row names from Excel Sheet1) */
const ELEMENT_SUBFACTOR_LABELS: string[][] = [
  // Table 7 — EARTH (Prithvi) ELEMENT
  ['Stability', 'Structure', 'Nourishment', 'Weight', 'Fertility', 'Patience', 'Manifestation'],
  // Table 8 — WATER (Jala) ELEMENT
  ['Fluidity', 'Emotion', 'Cohesion', 'Memory', 'Purification', 'Intuition', 'Surrender'],
  // Table 9 — FIRE (Agni) ELEMENT
  ['Digestion', 'Transformation', 'Illumination', 'Vitality', 'Aspiration', 'Willpower', 'Purification'],
  // Table 10 — AIR (Vayu) ELEMENT
  ['Movement', 'Breath', 'Communication', 'Connection', 'Freedom', 'Cognition', 'Transmission'],
  // Table 11 — ETHER (Akasha) ELEMENT
  ['Space', 'Stillness', 'Receptivity', 'Sound', 'Perception', 'Unity', 'Potential'],
  // Table 12 — TIME (Kala) ELEMENT
  ['Sequence', 'Rhythm', 'Change', 'Timing', 'Duration', 'Memory', 'Eternity'],
  // Table 13 — SOUL (Atman) ELEMENT
  ['Awareness', 'Witness', 'Identity', 'Freedom', 'Bliss', 'Connection', 'Purpose']
];

/** Tables 14–20: 7 Detailed Chakras (Exact row names from Excel Sheet1) */
const CHAKRA_SUBFACTOR_LABELS: string[][] = [
  // Table 14 — ROOT CHAKRA
  ['Survival', 'Grounding', 'Security', 'Family', 'Abundance', 'Health', 'Presence'],
  // Table 15 — SACRAL CHAKRA
  ['Creativity', 'Emotion', 'Sensuality', 'Passion', 'Connection', 'Movement', 'Letting Go'],
  // Table 16 — SOLAR PLEXUS CHAKRA
  ['Willpower', 'Purpose', 'Self-Esteem', 'Discipline', 'Digestion', 'Resilience', 'Ambition'],
  // Table 17 — HEART CHAKRA
  ['Love', 'Compassion', 'Forgiveness', 'Connection', 'Harmony', 'Healing', 'Altruism'],
  // Table 18 — THROAT CHAKRA
  ['Communication', 'Truth', 'Creativity', 'Listening', 'Purpose', 'Presence', 'Influence'],
  // Table 19 — THIRD EYE CHAKRA
  ['Intuition', 'Clarity', 'Insight', 'Wisdom', 'Vision', 'Discernment', 'Realization'],
  // Table 20 — CROWN CHAKRA
  ['Enlightenment', 'Unity', 'Bliss', 'Service', 'Surrender', 'Completion', 'Eternity']
];

/** Specific guideline bounds for detailed Chakras 14–20 */
const DETAILED_CHAKRA_BOUNDS: { min: number; max: number }[] = [
  { min: 71.5, max: 74.5 }, // 14: Root
  { min: 68.5, max: 71.0 }, // 15: Sacral
  { min: 66.5, max: 68.0 }, // 16: Solar Plexus
  { min: 64.5, max: 66.0 }, // 17: Heart
  { min: 60.5, max: 64.0 }, // 18: Throat
  { min: 38.5, max: 44.5 }, // 19: Third Eye
  { min: 23.5, max: 28.5 }  // 20: Crown
];

/** Tables 21–27: 7 Koshas / Sheaths (Exact row names from Excel Sheet1) */
const KOSHA_SUBFACTOR_LABELS: string[][] = [
  // Table 21 — THE FOOD SHEATH (Annamaya)
  ['Nutrition', 'Structure', 'Sensation', 'Health', 'Activity', 'Rest', 'Mortality'],
  // Table 22 — THE ENERGY SHEATH (Pranamaya)
  ['Prana', 'Prana Vayu', 'Apana Vayu', 'Samana Vayu', 'Udana Vayu', 'Vyana Vayu', 'Nadis'],
  // Table 23 — THE MENTAL SHEATH (Manomaya)
  ['Perception', 'Emotion', 'Memory', 'Desire', 'Thought', 'Attachment', 'Ego'],
  // Table 24 — THE WISDOM SHEATH (Vijnanamaya)
  ['Buddhi', 'Discrimination', 'Understanding', 'Wisdom', 'Intuition', 'Realization', 'Self-Knowledge'],
  // Table 25 — THE BLISS SHEATH (Anandamaya)
  ['Peace', 'Joy', 'Contentment', 'Bliss', 'Love', 'Purity', 'Causal'],
  // Table 26 — THE IMMORTALITY SHEATH (Amritamaya)
  ['Fearlessness', 'Eternal Awareness', 'Liberation', 'Grace', 'Immortality', 'Vision', 'Transfiguration'],
  // Table 27 — THE CONSCIOUSNESS SHEATH (Shivamaya)
  ['Oneness', 'Divinity', 'Purity', 'Bliss', 'Grace', 'Creation', 'Completion']
];

/** Tables 28–31: 4 Pillars of Life (Exact row names from Excel Sheet1) */
const PILLAR_LABELS: { title: string; rows: string[] }[] = [
  { title: 'THE INTAKE', rows: ['Food', 'Impressions', 'Information', 'Relationships', 'Environment', 'Spiritual Influence', 'Self-Observation'] },
  { title: 'THE RECREATION', rows: ['Rest', 'Recreation', 'Movement', 'Travel', 'Play', 'Nature', 'Balance'] },
  { title: 'THE CONDUCT', rows: ['Ethics', 'Responsibility', 'Truthfulness', 'Compassion', 'Service', 'Discipline', 'Example'] },
  { title: 'THE THINKING', rows: ['Reflection', 'Discrimination', 'Inquiry', 'Meditation', 'Observation', 'Integration', 'Intuition'] }
];

/** Tables 32–34: Psychological Structures (Exact row names from Excel Sheet1) */
const PSYCHOLOGICAL_LABELS: { title: string; rows: string[] }[] = [
  { title: 'THE COMPLEXES', rows: ['Attachment', 'Aversion', 'Ego', 'Pride', 'Fear', 'Anger', 'Desire'] },
  { title: 'THE ACCEPTANCE', rows: ['Surrender', 'Acceptance', 'Equanimity', 'Gratitude', 'Forgiveness', 'Love', 'Peace'] },
  { title: 'THE DECISION', rows: ['Commitment', 'Willpower', 'Determination', 'Courage', 'Integrity', 'Discernment', 'Trust'] }
];

/** Tables 35–37: Ayurvedic Tridosha (Exact row names from Excel Sheet1) */
const TRIDOSHA_LABELS: { title: string; rows: string[] }[] = [
  { title: 'VATA DOSHA', rows: ['Movement', 'Air', 'Communication', 'Rhythm', 'Creativity', 'Anxiety', 'Responsiveness'] },
  { title: 'PITTA DOSHA', rows: ['Digestion', 'Intellect', 'Determination', 'Temperature', 'Ambition', 'Anger', 'Intelligence'] },
  { title: 'KAPHA DOSHA', rows: ['Structure', 'Stability', 'Immunity', 'Nourishment', 'Contentment', 'Compassion', 'Tendency'] }
];

/** Tables 38–41: Antahkarana / 4 Mind Faculties (Exact row names from Excel Sheet1) */
const ANTAHKARANA_LABELS: { title: string; rows: string[] }[] = [
  { title: 'MANAS (Mind)', rows: ['Perception', 'Volition', 'Processing', 'Projection', 'Imagination', 'Instability', 'Expression'] },
  { title: 'BUDDHI (Intellect)', rows: ['Discrimination', 'Decision', 'Understanding', 'Wisdom', 'Realization', 'Judgment', 'Clarity'] },
  { title: 'AHAMKARA (Ego)', rows: ['Identity', 'Self-Concept', 'Identification', 'Pride', 'Protection', 'Ownership', 'Liberation'] },
  { title: 'CHITTA (Memory/Consciousness)', rows: ['Memory', 'Patterns', 'Imagination', 'Intuition', 'Subconscious', 'Samskara', 'Realization'] }
];

const COSMIC_CODES_CONFIG: { num: number; table: number; title: string; subtitle: string; factors: number[]; color: string; icon: string }[] = [
  { num: 1, table: 42, title: 'Unlimited Wealth & Material Mastery', subtitle: 'Earth element, Root Chakra, Annamaya Kosha', factors: [0, 1], color: '#f59e0b', icon: '💎' },
  { num: 2, table: 43, title: 'Professional Greatness & Cosmic Purpose', subtitle: 'Fire element, Solar Plexus, Vijnanamaya Kosha', factors: [2, 3], color: '#ef4444', icon: '🌟' },
  { num: 3, table: 44, title: 'Supreme Energy & Perfect Health', subtitle: 'Water/Fire elements, Pranamaya Kosha, Vitality', factors: [1, 3], color: '#10b981', icon: '⚡' },
  { num: 4, table: 45, title: 'Infinite Compassion & Divine Affection', subtitle: 'Heart Chakra, Anandamaya Kosha', factors: [4, 6], color: '#ec4899', icon: '❤️' },
  { num: 5, table: 46, title: 'Ancestral Power & Bloodline Healing', subtitle: 'Spiritual Lineage, Soul Connections, Crown Chakra', factors: [5, 6], color: '#8b5cf6', icon: '🌳' },
  { num: 6, table: 47, title: 'Absolute Authority & Sovereign Command', subtitle: 'Solar Plexus, Ahamkara, Fire Element', factors: [2, 4], color: '#f97316', icon: '👑' },
  { num: 7, table: 48, title: 'Radiant Joy & Eternal Inner Peace', subtitle: 'Anandamaya Kosha, Heart Chakra, Chitta', factors: [4, 5], color: '#fbbf24', icon: '☀️' },
  { num: 8, table: 49, title: 'Cosmic Consciousness & Divine Union', subtitle: 'Crown Chakra, Shivamaya Kosha, Akasha', factors: [5, 6], color: '#6366f1', icon: '🔮' },
  { num: 9, table: 50, title: 'Limitless Creativity & Visionary Genius', subtitle: 'Sacral Chakra, Third Eye, Manomaya Kosha', factors: [2, 5], color: '#06b6d4', icon: '🎨' },
  { num: 10, table: 51, title: 'Fearless Adventure & Discovery', subtitle: 'Air Element, Vihaar, Amritamaya Kosha', factors: [0, 2], color: '#84cc16', icon: '🚀' },
  { num: 11, table: 52, title: 'Sacred Action & Cosmic Duty', subtitle: 'Aachar Conduct, Heart/Crown Chakra, Dharma', factors: [3, 4], color: '#14b8a6', icon: '⚖️' },
  { num: 12, table: 53, title: 'Ultimate Liberation & Soul Transcendence', subtitle: 'Amritamaya/Shivamaya Koshas, Atman', factors: [5, 6], color: '#a855f7', icon: '🕊️' }
];

const SPIRITUAL_OBSERVANCES_BASE: { id: string; name: string; present: number }[] = [
  { id: 'parental_respect', name: 'Parental Respect', present: 3.2 },
  { id: 'family_deity', name: 'Family Deity Devotion', present: 3.7 },
  { id: 'faith_spirituality', name: 'Faith in Spirituality', present: 3.3 },
  { id: 'spiritual_practices', name: 'Spiritual Practices', present: 5.2 },
  { id: 'knowledge_time', name: 'Knowledge of Time', present: 4.9 },
  { id: 'knowledge_directions', name: 'Knowledge of Directions', present: 4.5 },
  { id: 'breathing_practices', name: 'Breathing Practices', present: 3.1 }
];

const VEDIC_MAPPINGS_BASE: { factorId: string; originalName: string; vedicName: string; description: string }[] = [
  { factorId: 'genetic_inheritance', originalName: 'Genetic Inheritance', vedicName: 'Genetic Blueprint', description: 'The encoded biological template transmitted across generations' },
  { factorId: 'constitutional_vitality', originalName: 'Constitutional Vitality', vedicName: 'Health Inheritance', description: 'The pranic vitality and physiological constitution received at birth' },
  { factorId: 'mental_patterns', originalName: 'Mental Patterns', vedicName: 'Mental Influence', description: 'The subconscious mental architectures and inherited thought patterns' },
  { factorId: 'intellectual_capacity', originalName: 'Intellectual Capacity', vedicName: 'Intellectual Nurturance', description: 'The cultivated and inherited faculties of higher reasoning and learning' },
  { factorId: 'emotional_foundation', originalName: 'Emotional Foundation', vedicName: 'Emotional Environment', description: 'The emotional climate and temperamental baseline inherited from lineage' },
  { factorId: 'spiritual_lineage', originalName: 'Spiritual Lineage', vedicName: 'Spiritual Guidance', description: 'The ancestral spiritual wisdom and dharmic inheritance across lifetimes' },
  { factorId: 'soul_connections', originalName: 'Soul Connections', vedicName: 'Cosmic Bonds', description: 'The soul-level relational bonds and karmic agreements from past lives' }
];

function buildRow(id: string, name: string, seedValue: number, currentMultiplierPct: number, targetMultiplierPct: number, sourceFactorId?: string, description?: string): QssTableRow {
  const currentStatus = Number((seedValue * (currentMultiplierPct / 100)).toFixed(3));
  const targetLevel   = Number((currentStatus * (targetMultiplierPct / 100)).toFixed(3));
  const gapToGoal     = Number((targetLevel - currentStatus).toFixed(3));
  return { id, name, currentStatus, targetLevel, gapToGoal, sourceFactorId, description };
}

function buildTable(tableNumber: number, title: string, tier: 1|2|3|4|5|6, tierLabel: string, rows: QssTableRow[], guideline?: QssTableGuideline): QssTable {
  const totalCurrent = Number(rows.reduce((a, r) => a + r.currentStatus, 0).toFixed(3));
  const totalTarget  = Number(rows.reduce((a, r) => a + r.targetLevel,   0).toFixed(3));
  const totalGap     = Number(rows.reduce((a, r) => a + r.gapToGoal,     0).toFixed(3));
  return { tableNumber, title, tier, tierLabel, rows, totalCurrentStatus: totalCurrent, totalTargetLevel: totalTarget, totalGapToGoal: totalGap, guideline };
}

export function calculateQSS(factors: FactorValue[], customConfig?: Partial<QssCalibrationConfig>): QssResult {
  const cfg: QssCalibrationConfig = { ...DEFAULT_QSS_CONFIG, ...customConfig };
  const totals = factors.map(f => f.totalValue);
  const tables: QssTable[] = [];
  const targetMul = cfg.targetMultiplierPct;

  // Tier 2: Chakras & Auras
  const chakraGuideline: QssTableGuideline = {
    currentMinPct: 39.5, currentMaxPct: 44.5, appliedCurrentPct: cfg.chakraPct,
    targetMinPct: 135.0, targetMaxPct: 140.0, appliedTargetPct: targetMul,
    source: 'Total of Parental Legacy', guidanceText: 'Current status Values are taken 39.5% to 44.5% of the total of Parental Legacy. Target Level 135% to 140% of Current Status'
  };
  const chakraRows: QssTableRow[] = totals.map((t, i) => buildRow(`chakra_${i}`, CHAKRA_LABELS[i], t, cfg.chakraPct, targetMul, factors[i].factorId));
  tables.push(buildTable(2, 'CHAKRA LEVELS', 2, 'Tier 2: Energy Architecture', chakraRows, chakraGuideline));

  const auraGuideline: QssTableGuideline = {
    currentMinPct: 33.5, currentMaxPct: 38.5, appliedCurrentPct: cfg.auraPct,
    targetMinPct: 135.0, targetMaxPct: 140.0, appliedTargetPct: targetMul,
    source: 'Total of Parental Legacy', guidanceText: 'Current status Values are taken 33.5% to 38.5% of the total of Parental Legacy. Target Level 135% to 140% of Current Status'
  };
  tables.push(buildTable(3, 'AURA LEVELS', 2, 'Tier 2: Energy Architecture', totals.map((t, i) => buildRow(`aura_${i}`, AURA_LABELS[i], t, cfg.auraPct, targetMul, factors[i].factorId)), auraGuideline));

  // Tier 3: Karmic & Elements
  const t4Guideline: QssTableGuideline = {
    currentMinPct: 28.5, currentMaxPct: 33.5, appliedCurrentPct: cfg.positiveKarmicPct,
    targetMinPct: 135.0, targetMaxPct: 140.0, appliedTargetPct: targetMul,
    source: 'Total of Parental Legacy', guidanceText: 'Current status Values are taken 28.5% to 33.5% of the total of Parental Legacy. Target Level 135% to 140% of Current Status'
  };
  tables.push(buildTable(4, KARMIC_ROW_LABELS[0].title, 3, 'Tier 3: Karmic & Elements', KARMIC_ROW_LABELS[0].rows.map((name, i) => buildRow(`karmic_4_${i}`, name, totals[i], cfg.positiveKarmicPct, targetMul, factors[i].factorId)), t4Guideline));

  const t5Guideline: QssTableGuideline = {
    currentMinPct: 41.5, currentMaxPct: 44.5, appliedCurrentPct: cfg.karmicRefinementPct,
    targetMinPct: 135.0, targetMaxPct: 140.0, appliedTargetPct: targetMul,
    source: 'Total of Parental Legacy', guidanceText: 'Current status Values are taken 41.5% to 44.5% of the total of Parental Legacy. Target Level 135% to 140% of Current Status'
  };
  const t5Rows = KARMIC_ROW_LABELS[1].rows.map((name, i) => buildRow(`karmic_5_${i}`, name, totals[i], cfg.karmicRefinementPct, targetMul, factors[i].factorId));
  tables.push(buildTable(5, KARMIC_ROW_LABELS[1].title, 3, 'Tier 3: Karmic & Elements', t5Rows, t5Guideline));

  const t6Guideline: QssTableGuideline = {
    currentMinPct: 85.5, currentMaxPct: 88.5, appliedCurrentPct: cfg.karmicBalancingPct,
    targetMinPct: 135.0, targetMaxPct: 140.0, appliedTargetPct: targetMul,
    source: 'Current Status of Karmic Refinement', guidanceText: 'Current status Values are taken 85.5% to 88.5% of the Current of Karmic Refinement. Target Level 135% to 140% of Current Status'
  };
  tables.push(buildTable(6, KARMIC_ROW_LABELS[2].title, 3, 'Tier 3: Karmic & Elements', KARMIC_ROW_LABELS[2].rows.map((name, i) => buildRow(`karmic_6_${i}`, name, t5Rows[i].currentStatus, cfg.karmicBalancingPct, targetMul, factors[i].factorId)), t6Guideline));

  // Tables 7–13: 7 Great Elements
  const elementPcts = [cfg.elementEarthPct, cfg.elementWaterPct, cfg.elementFirePct, cfg.elementAirPct, cfg.elementEtherPct, cfg.elementTimePct, cfg.elementSoulPct];
  const elementGuidelines: QssTableGuideline[] = [
    { currentMinPct: 55.5, currentMaxPct: 58.5, appliedCurrentPct: cfg.elementEarthPct, targetMinPct: 135, targetMaxPct: 140, appliedTargetPct: targetMul, source: 'Total of Parental Legacy', guidanceText: 'Current status Values are taken 55.5% to 58.5% of the total of Parental Legacy. Target Level 135% to 140% of Current Status' },
    { currentMinPct: 61.5, currentMaxPct: 66.5, appliedCurrentPct: cfg.elementWaterPct, targetMinPct: 135, targetMaxPct: 140, appliedTargetPct: targetMul, source: 'Total of Parental Legacy', guidanceText: 'Current status Values are taken 61.5% to 66.5% of the total of Parental Legacy. Target Level 135% to 140% of Current Status' },
    { currentMinPct: 59.5, currentMaxPct: 63.5, appliedCurrentPct: cfg.elementFirePct, targetMinPct: 135, targetMaxPct: 140, appliedTargetPct: targetMul, source: 'Total of Parental Legacy', guidanceText: 'Current status Values are taken 59.5% to 63.5% of the total of Parental Legacy. Target Level 135% to 140% of Current Status' },
    { currentMinPct: 67.5, currentMaxPct: 69.5, appliedCurrentPct: cfg.elementAirPct, targetMinPct: 135, targetMaxPct: 140, appliedTargetPct: targetMul, source: 'Total of Parental Legacy', guidanceText: 'Current status Values are taken 67.5% to 69.5% of the total of Parental Legacy. Target Level 135% to 140% of Current Status' },
    { currentMinPct: 33.5, currentMaxPct: 38.5, appliedCurrentPct: cfg.elementEtherPct, targetMinPct: 135, targetMaxPct: 140, appliedTargetPct: targetMul, source: 'Total of Parental Legacy', guidanceText: 'Current status Values are taken 33.5% to 38.5% of the total of Parental Legacy. Target Level 135% to 140% of Current Status' },
    { currentMinPct: 64.5, currentMaxPct: 68.5, appliedCurrentPct: cfg.elementTimePct, targetMinPct: 135, targetMaxPct: 140, appliedTargetPct: targetMul, source: 'Total of Parental Legacy', guidanceText: 'Current status Values are taken 64.5% to 68.5% of the total of Parental Legacy. Target Level 135% to 140% of Current Status' },
    { currentMinPct: 31.5, currentMaxPct: 35.5, appliedCurrentPct: cfg.elementSoulPct, targetMinPct: 135, targetMaxPct: 140, appliedTargetPct: targetMul, source: 'Total of Parental Legacy', guidanceText: 'Current status Values are taken 31.5% to 35.5% of the total of Parental Legacy. Target Level 135% to 140% of Current Status' }
  ];
  const elementTableTitles = [
    'EARTH (Prithvi) ELEMENT', 'WATER (Jala) ELEMENT', 'FIRE (Agni) ELEMENT',
    'AIR (Vayu) ELEMENT', 'ETHER (Akasha) ELEMENT', 'TIME (Kala) ELEMENT', 'SOUL (Atman) ELEMENT'
  ];
  const elementTables: QssTable[] = [];
  for (let e = 0; e < 7; e++) {
    const rows = ELEMENT_SUBFACTOR_LABELS[e].map((name, i) =>
      buildRow(`elem_${e}_${i}`, name, totals[i], elementPcts[e], targetMul, factors[i].factorId));
    const table = buildTable(7 + e, elementTableTitles[e], 3, 'Tier 3: Karmic & Elements', rows, elementGuidelines[e]);
    elementTables.push(table);
    tables.push(table);
  }

  // Tier 4: Granular Chakra & Koshas
  const chakraTableTitles = [
    'ROOT CHAKRA', 'SACRAL CHAKRA', 'SOLAR PLEXUS CHAKRA',
    'HEART CHAKRA', 'THROAT CHAKRA', 'THIRD EYE CHAKRA', 'CROWN CHAKRA'
  ];
  for (let c = 0; c < 7; c++) {
    const b = DETAILED_CHAKRA_BOUNDS[c];
    const appliedP = cfg.mode === 'min' ? b.min : (cfg.mode === 'max' ? b.max : Number(((b.min + b.max) / 2).toFixed(2)));
    const cGuideline: QssTableGuideline = {
      currentMinPct: b.min, currentMaxPct: b.max, appliedCurrentPct: appliedP, targetMinPct: 135.0, targetMaxPct: 140.0, appliedTargetPct: targetMul,
      source: 'Total of Parental Legacy', guidanceText: `Current status Values are taken ${b.min}% to ${b.max}% of the total of Parental Legacy. Target Level 135% to 140% of Current Status`
    };
    tables.push(buildTable(14 + c, chakraTableTitles[c], 4, 'Tier 4: Granular Chakra & Kosha', CHAKRA_SUBFACTOR_LABELS[c].map((name, si) => buildRow(`chakra_detail_${c}_${si}`, name, totals[si], appliedP, targetMul, factors[si].factorId)), cGuideline));
  }

  const koshaTableTitles = [
    'THE FOOD SHEATH', 'THE ENERGY SHEATH', 'THE MENTAL SHEATH',
    'THE WISDOM SHEATH', 'THE BLISS SHEATH', 'THE IMMORTALITY SHEATH', 'THE CONSCIOUSNESS SHEATH'
  ];
  for (let k = 0; k < 7; k++) {
    const kGuideline: QssTableGuideline = {
      currentMinPct: 65.0, currentMaxPct: 65.0, appliedCurrentPct: cfg.koshasPct, targetMinPct: 135.0, targetMaxPct: 140.0, appliedTargetPct: targetMul,
      source: `Current Status of ${CHAKRA_LABELS[k]}`, guidanceText: `Current status Values are taken 65% of the Current Status of ${CHAKRA_LABELS[k]}. Target Level 135% to 140% of Current Status`
    };
    const rows = KOSHA_SUBFACTOR_LABELS[k].map((name, i) =>
      buildRow(`kosha_detail_${k}_${i}`, name, chakraRows[i].currentStatus, cfg.koshasPct, targetMul, factors[i].factorId));
    tables.push(buildTable(21 + k, koshaTableTitles[k], 4, 'Tier 4: Granular Chakra & Kosha', rows, kGuideline));
  }

  // Tier 5: Pillars, Psychological, Tridosha, Antahkarana
  const pillarGuideline: QssTableGuideline = {
    currentMinPct: 45.5, currentMaxPct: 55.5, appliedCurrentPct: cfg.pillarsPct, targetMinPct: 135.0, targetMaxPct: 140.0, appliedTargetPct: targetMul,
    source: 'Current Status of Respective Element', guidanceText: 'Current status Values are taken 45.5% to 55.5% Current Status of respective Element. Target Level 135% to 140% of Current Status'
  };
  PILLAR_LABELS.forEach(({ title, rows: rn }, pi) => tables.push(buildTable(28 + pi, title, 5, 'Tier 5: Lifestyle & Mind', rn.map((name, i) => buildRow(`pillar_${pi}_${i}`, name, elementTables[pi].rows[i].currentStatus, cfg.pillarsPct, targetMul, factors[i].factorId)), pillarGuideline)));
  PSYCHOLOGICAL_LABELS.forEach(({ title, rows: rn }, pi) => tables.push(buildTable(32 + pi, title, 5, 'Tier 5: Lifestyle & Mind', rn.map((name, i) => buildRow(`psych_${pi}_${i}`, name, elementTables[4 + pi].rows[i].currentStatus, cfg.pillarsPct, targetMul, factors[i].factorId)), pillarGuideline)));

  const doshaGuideline: QssTableGuideline = {
    currentMinPct: 68.5, currentMaxPct: 71.0, appliedCurrentPct: cfg.doshasAndAntahkaranaPct, targetMinPct: 135.0, targetMaxPct: 140.0, appliedTargetPct: targetMul,
    source: 'Current Status of Respective Element', guidanceText: 'Current status Values are taken 68.5% to 71% of Current Status of respective Element. Target Level 135% to 140% of Current Status'
  };
  TRIDOSHA_LABELS.forEach(({ title, rows: rn }, di) => tables.push(buildTable(35 + di, title, 5, 'Tier 5: Lifestyle & Mind', rn.map((name, i) => buildRow(`dosha_${di}_${i}`, name, elementTables[di].rows[i].currentStatus, cfg.doshasAndAntahkaranaPct, targetMul, factors[i].factorId)), doshaGuideline)));
  ANTAHKARANA_LABELS.forEach(({ title, rows: rn }, ai) => tables.push(buildTable(38 + ai, title, 5, 'Tier 5: Lifestyle & Mind', rn.map((name, i) => buildRow(`antah_${ai}_${i}`, name, elementTables[3 + ai].rows[i].currentStatus, cfg.doshasAndAntahkaranaPct, targetMul, factors[i].factorId)), doshaGuideline)));

  // Tier 6: 12 Cosmic Codes
  const cosmicGuideline: QssTableGuideline = {
    currentMinPct: 39.5, currentMaxPct: 44.5, appliedCurrentPct: cfg.chakraPct, targetMinPct: 135.0, targetMaxPct: 140.0, appliedTargetPct: targetMul,
    source: 'Dual Contributing Factor Totals', guidanceText: 'Synthesized master codes averaging contributing life factors. Target Level 135% to 140% of Current Status'
  };
  const cosmicCodes: CosmicCode[] = COSMIC_CODES_CONFIG.map(cc => {
    const avgTotal = cc.factors.reduce((s, fi) => s + totals[fi], 0) / cc.factors.length;
    const current  = Number((avgTotal * (cfg.chakraPct / 100)).toFixed(3));
    const target   = Number((current * (targetMul / 100)).toFixed(3));
    const gap      = Number((target - current).toFixed(3));
    return { codeNumber: cc.num, tableNumber: cc.table, title: cc.title, subtitle: cc.subtitle, currentStatus: current, targetLevel: target, gapToGoal: gap, contributingFactors: cc.factors.map(fi => factors[fi].factorName), color: cc.color, icon: cc.icon };
  });
  COSMIC_CODES_CONFIG.forEach((cc, ci) => {
    const rows = cc.factors.flatMap(fi => totals.map((t, si) => buildRow(`cosmic_${ci}_${si}`, factors[si].factorName, t, cfg.chakraPct, targetMul, factors[si].factorId))).slice(0, 7);
    tables.push(buildTable(cc.table, cc.title, 6, 'Tier 6: 12 Cosmic Master Codes', rows, cosmicGuideline));
  });
  const allCodesRows: QssTableRow[] = cosmicCodes.map(cc => ({ id: `all_codes_${cc.codeNumber}`, name: `Code ${cc.codeNumber}: ${cc.title.split('&')[0].trim()}`, currentStatus: cc.currentStatus, targetLevel: cc.targetLevel, gapToGoal: cc.gapToGoal }));
  const allCodesComparison = buildTable(54, 'All 12 Codes — Master Comparison', 6, 'Tier 6: 12 Cosmic Master Codes', allCodesRows, cosmicGuideline);
  tables.push(allCodesComparison);

  const spiritualObservances: SpiritualObservance[] = SPIRITUAL_OBSERVANCES_BASE.map(s => ({ id: s.id, name: s.name, presentLevel: s.present, requiredLevel: Number((s.present * 0.45).toFixed(3)), minimumLevel: Number((s.present * 0.25).toFixed(3)) }));
  const vedicMappings: VedicMapping[] = VEDIC_MAPPINGS_BASE.map(v => ({ ...v }));

  return { tables, spiritualObservances, vedicMappings, cosmicCodes, allCodesComparison, config: cfg };
}
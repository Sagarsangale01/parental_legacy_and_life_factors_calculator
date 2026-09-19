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

const CHAKRA_LABELS: string[] = [
  'Root Chakra (Muladhara)', 'Sacral Chakra (Svadhisthana)', 'Solar Plexus (Manipura)',
  'Heart Chakra (Anahata)', 'Throat Chakra (Vishuddha)', 'Third Eye (Ajna)', 'Crown Chakra (Sahasrara)'
];
const AURA_LABELS: string[] = [
  'Physical Aura', 'Etheric Aura', 'Emotional Aura', 'Mental Aura', 'Astral Aura', 'Celestial Aura', 'Ketheric Template'
];
const ELEMENT_LABELS: string[] = [
  'Earth (Prithvi)', 'Water (Jala)', 'Fire (Agni)', 'Air (Vayu)', 'Ether (Akasha)', 'Time (Kala)', 'Soul (Atman)'
];
const KARMIC_ROW_LABELS: { table: number; title: string; rows: string[] }[] = [
  { table: 4, title: 'Positive Karmic Deeds', rows: ['Compassionate Acts', 'Charitable Service', 'Spiritual Merit', 'Ancestral Blessings', 'Righteous Conduct', 'Wisdom Sharing', 'Divine Devotion'] },
  { table: 5, title: 'Karmic Refinement Sectors', rows: ['Health Karma', 'Wealth Karma', 'Relationship Karma', 'Career Karma', 'Spiritual Karma', 'Family Karma', 'Destiny Karma'] },
  { table: 6, title: 'Karmic Balancing', rows: ['Resolution Index', 'Clearance Rate', 'Debt Offset', 'Grace Accumulation', 'Soul Contract Progress', 'Ancestral Healing', 'Cosmic Alignment'] }
];
const KOSHA_LABELS: string[] = [
  'Annamaya Kosha (Food Sheath)', 'Pranamaya Kosha (Energy Sheath)', 'Manomaya Kosha (Mental Sheath)',
  'Vijnanamaya Kosha (Wisdom Sheath)', 'Anandamaya Kosha (Bliss Sheath)', 'Amritamaya Kosha (Immortality Sheath)', 'Shivamaya Kosha (Consciousness Sheath)'
];
const KOSHA_SUBFACTOR_LABELS: string[][] = [
  // Table 22 — Annamaya Kosha (Food Sheath)
  ['Nutrition', 'Structure', 'Sensation', 'Health', 'Activity', 'Rest', 'Mortality'],
  // Table 23 — Pranamaya Kosha (Energy Sheath)
  ['Prana Flow', 'Breath Quality', 'Vital Force', 'Energy Reserves', 'Chi Balance', 'Nadis Health', 'Aura Vitality'],
  // Table 24 — Manomaya Kosha (Mental Sheath)
  ['Thought Patterns', 'Emotional Mind', 'Desire Nature', 'Memory Quality', 'Mind Clarity', 'Mental Peace', 'Reaction Speed'],
  // Table 25 — Vijnanamaya Kosha (Wisdom Sheath)
  ['Discrimination Power', 'Wisdom Depth', 'Intuitive Knowing', 'Ethical Clarity', 'Spiritual Insight', 'Higher Learning', 'Truth Perception'],
  // Table 26 — Anandamaya Kosha (Bliss Sheath)
  ['Inner Joy', 'Contentment', 'Gratitude Level', 'Peace Depth', 'Love Quality', 'Bliss Access', 'Divine Connection'],
  // Table 27 — Amritamaya Kosha (Immortality Sheath)
  ['Timeless Awareness', 'Deathless Nature', 'Soul Continuity', 'Astral Travel', 'Past Life Access', 'Rebirth Wisdom', 'Eternal Presence']
];
const ELEMENT_SUBFACTOR_LABELS: string[][] = [
  // Table 8 — Earth (Prithvi)
  ['Physical Body', 'Bone Structure', 'Material World', 'Stability Factor', 'Grounding Force', 'Earth Connection', 'Manifestation'],
  // Table 9 — Water (Jala)
  ['Emotional Fluidity', 'Adaptability', 'Purification', 'Flow State', 'Receptivity', 'Nourishment', 'Healing Waters'],
  // Table 10 — Fire (Agni)
  ['Digestive Fire', 'Transformation', 'Radiance', 'Metabolism', 'Courage', 'Purifying Flame', 'Solar Power'],
  // Table 11 — Air (Vayu)
  ['Breath & Life Force', 'Movement Energy', 'Communication', 'Mental Speed', 'Flexibility', 'Nervous System', 'Freedom'],
  // Table 12 — Ether (Akasha)
  ['Space Awareness', 'Sound Resonance', 'Vibrational Field', 'Expansion', 'Inner Silence', 'Cosmic Reception', 'Subtle Perception'],
  // Table 13 — Time (Kala)
  ['Past Integration', 'Present Awareness', 'Future Vision', 'Timing Mastery', 'Karmic Cycles', 'Rhythmic Flow', 'Temporal Wisdom']
];
const CHAKRA_SUBFACTOR_LABELS: string[][] = [
  ['Physical Security', 'Grounding Energy', 'Survival Instinct', 'Earth Connection', 'Material Stability', 'Ancestral Roots', 'Body Vitality'],
  ['Creative Force', 'Emotional Flow', 'Sexual Energy', 'Pleasure Balance', 'Passion Drive', 'Relational Joy', 'Sensory Harmony'],
  ['Personal Power', 'Willpower', 'Confidence Level', 'Ambition Drive', 'Self-Mastery', 'Digestive Fire', 'Action Energy'],
  ['Unconditional Love', 'Compassion Depth', 'Heart Healing', 'Emotional Balance', 'Forgiveness', 'Empathy Capacity', 'Harmony Field'],
  ['Communication Clarity', 'Authentic Expression', 'Creative Voice', 'Truth Resonance', 'Listening Ability', 'Sonic Frequency', 'Vibrational Speech'],
  ['Intuitive Sight', 'Psychic Clarity', 'Mental Vision', 'Wisdom Access', 'Inner Knowing', 'Dream Clarity', 'Higher Perception'],
  ['Spiritual Connection', 'Divine Grace', 'Universal Unity', 'Enlightenment Index', 'Cosmic Awareness', 'Higher Self Link', 'Transcendence']
];
const DETAILED_CHAKRA_BOUNDS: { min: number; max: number }[] = [
  { min: 71.5, max: 74.5 }, { min: 68.5, max: 71.0 }, { min: 66.5, max: 68.0 },
  { min: 64.5, max: 66.0 }, { min: 60.5, max: 64.0 }, { min: 38.5, max: 44.5 }, { min: 23.5, max: 28.5 }
];
const PILLAR_LABELS: { title: string; rows: string[] }[] = [
  { title: 'Ahaar (The Intake)', rows: ['Nutritional Quality', 'Mental Nourishment', 'Emotional Intake', 'Spiritual Food', 'Sensory Input', 'Social Nourishment', 'Creative Fuel'] },
  { title: 'Vihaar (The Recreation)', rows: ['Physical Play', 'Creative Leisure', 'Social Recreation', 'Nature Connection', 'Artistic Expression', 'Spiritual Retreat', 'Mind Recreation'] },
  { title: 'Aachar (The Conduct)', rows: ['Ethical Behavior', 'Social Responsibility', 'Disciplined Routine', 'Righteous Action', 'Moral Integrity', 'Environmental Care', 'Dharmic Living'] },
  { title: 'Vichaar (The Thinking)', rows: ['Positive Mindset', 'Creative Thinking', 'Analytical Clarity', 'Visionary Thought', 'Philosophical Depth', 'Problem Solving', 'Meditative Focus'] }
];
const PSYCHOLOGICAL_LABELS: { title: string; rows: string[] }[] = [
  { title: 'The Complexes (Bhavana)', rows: ['Inferiority Pattern', 'Superiority Pattern', 'Abandonment Pattern', 'Control Pattern', 'Validation Need', 'Perfectionism', 'Shadow Integration'] },
  { title: 'The Acceptance (Sweekar)', rows: ['Self Acceptance', 'Other Acceptance', 'Life Acceptance', 'Past Acceptance', 'Present Acceptance', 'Future Acceptance', 'Cosmic Acceptance'] },
  { title: 'The Decision (Nirdhaar)', rows: ['Career Decisiveness', 'Relationship Choices', 'Financial Decisions', 'Spiritual Decisions', 'Health Choices', 'Creative Direction', 'Life Purpose Clarity'] }
];
const TRIDOSHA_LABELS: { title: string; rows: string[] }[] = [
  { title: 'Vata Dosha (Air & Ether)', rows: ['Movement Energy', 'Nervous System', 'Creativity Flow', 'Communication', 'Mental Speed', 'Flexibility', 'Inspiration'] },
  { title: 'Pitta Dosha (Fire & Water)', rows: ['Metabolic Fire', 'Intellectual Power', 'Leadership Drive', 'Digestion Quality', 'Vision & Focus', 'Transformation', 'Courage Level'] },
  { title: 'Kapha Dosha (Earth & Water)', rows: ['Physical Endurance', 'Emotional Stability', 'Immune Strength', 'Memory Retention', 'Compassion Level', 'Loyalty', 'Structural Form'] }
];
const ANTAHKARANA_LABELS: { title: string; rows: string[] }[] = [
  { title: 'Manas (Mind)', rows: ['Sensory Processing', 'Reactive Mind', 'Desire Center', 'Emotional Response', 'Memory Access', 'Imagination', 'Dream State'] },
  { title: 'Buddhi (Intellect)', rows: ['Discernment Power', 'Logical Analysis', 'Wisdom Filter', 'Decision Making', 'Higher Reasoning', 'Intuitive Logic', 'Truth Recognition'] },
  { title: 'Ahamkara (Ego)', rows: ['Identity Formation', 'Self Concept', 'Role Attachment', 'Pride Level', 'Boundary Setting', 'Personal Will', 'Ego Integration'] },
  { title: 'Chitta (Memory/Consciousness)', rows: ['Memory Field', 'Subconscious Depth', 'Samskara Imprints', 'Cosmic Recording', 'Deep Awareness', 'Soul Memory', 'Universal Connection'] }
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
  tables.push(buildTable(2, 'Chakra Levels', 2, 'Tier 2: Energy Architecture', chakraRows, chakraGuideline));

  const auraGuideline: QssTableGuideline = {
    currentMinPct: 33.5, currentMaxPct: 38.5, appliedCurrentPct: cfg.auraPct,
    targetMinPct: 135.0, targetMaxPct: 140.0, appliedTargetPct: targetMul,
    source: 'Total of Parental Legacy', guidanceText: 'Current status Values are taken 33.5% to 38.5% of the total of Parental Legacy. Target Level 135% to 140% of Current Status'
  };
  tables.push(buildTable(3, 'Aura Levels', 2, 'Tier 2: Energy Architecture', totals.map((t, i) => buildRow(`aura_${i}`, AURA_LABELS[i], t, cfg.auraPct, targetMul, factors[i].factorId)), auraGuideline));

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

  const elementPcts = [cfg.elementEarthPct, cfg.elementWaterPct, cfg.elementFirePct, cfg.elementAirPct, cfg.elementEtherPct, cfg.elementTimePct, cfg.elementSoulPct];
  const t7Guideline: QssTableGuideline = {
    currentMinPct: 31.5, currentMaxPct: 69.5, appliedCurrentPct: Number(((cfg.elementEarthPct + cfg.elementWaterPct + cfg.elementFirePct + cfg.elementAirPct + cfg.elementEtherPct + cfg.elementTimePct + cfg.elementSoulPct) / 7).toFixed(1)),
    targetMinPct: 135.0, targetMaxPct: 140.0, appliedTargetPct: targetMul,
    source: 'Total of Parental Legacy (Elemental Multipliers)', guidanceText: 'Current status Values are calibrated per element (Earth: 55.5-58.5%, Water: 61.5-66.5%, Fire: 59.5-63.5%, Air: 67.5-69.5%, Ether: 33.5-38.5%, Time: 64.5-68.5%, Soul: 31.5-35.5%). Target Level 135% to 140%'
  };
  const elementRows = totals.map((t, i) => buildRow(`element_${i}`, ELEMENT_LABELS[i], t, elementPcts[i], targetMul, factors[i].factorId));
  tables.push(buildTable(7, '7 Great Elements (Pancha Mahabhuta)', 3, 'Tier 3: Karmic & Elements', elementRows, t7Guideline));

  const elementGuidelines: QssTableGuideline[] = [
    { currentMinPct: 55.5, currentMaxPct: 58.5, appliedCurrentPct: cfg.elementEarthPct, targetMinPct: 135, targetMaxPct: 140, appliedTargetPct: targetMul, source: 'Parental Legacy Total', guidanceText: 'Current status Values are taken 55.5% to 58.5% of the total of Parental Legacy. Target Level 135% to 140%' },
    { currentMinPct: 61.5, currentMaxPct: 66.5, appliedCurrentPct: cfg.elementWaterPct, targetMinPct: 135, targetMaxPct: 140, appliedTargetPct: targetMul, source: 'Parental Legacy Total', guidanceText: 'Current status Values are taken 61.5% to 66.5% of the total of Parental Legacy. Target Level 135% to 140%' },
    { currentMinPct: 59.5, currentMaxPct: 63.5, appliedCurrentPct: cfg.elementFirePct, targetMinPct: 135, targetMaxPct: 140, appliedTargetPct: targetMul, source: 'Parental Legacy Total', guidanceText: 'Current status Values are taken 59.5% to 63.5% of the total of Parental Legacy. Target Level 135% to 140%' },
    { currentMinPct: 67.5, currentMaxPct: 69.5, appliedCurrentPct: cfg.elementAirPct, targetMinPct: 135, targetMaxPct: 140, appliedTargetPct: targetMul, source: 'Parental Legacy Total', guidanceText: 'Current status Values are taken 67.5% to 69.5% of the total of Parental Legacy. Target Level 135% to 140%' },
    { currentMinPct: 33.5, currentMaxPct: 38.5, appliedCurrentPct: cfg.elementEtherPct, targetMinPct: 135, targetMaxPct: 140, appliedTargetPct: targetMul, source: 'Parental Legacy Total', guidanceText: 'Current status Values are taken 33.5% to 38.5% of the total of Parental Legacy. Target Level 135% to 140%' },
    { currentMinPct: 64.5, currentMaxPct: 68.5, appliedCurrentPct: cfg.elementTimePct, targetMinPct: 135, targetMaxPct: 140, appliedTargetPct: targetMul, source: 'Parental Legacy Total', guidanceText: 'Current status Values are taken 64.5% to 68.5% of the total of Parental Legacy. Target Level 135% to 140%' }
  ];
  for (let e = 0; e < 6; e++) {
    const rows = ELEMENT_SUBFACTOR_LABELS[e].map((name, i) =>
      buildRow(`elem_${e}_${i}`, name, totals[Math.min(i, totals.length - 1)], elementPcts[e], targetMul, factors[Math.min(i, factors.length - 1)].factorId));
    tables.push(buildTable(8 + e, `${ELEMENT_LABELS[e]} — Factor Analysis`, 3, 'Tier 3: Karmic & Elements', rows, elementGuidelines[e]));
  }

  // Tier 4: Granular Chakra & Koshas
  for (let c = 0; c < 7; c++) {
    const b = DETAILED_CHAKRA_BOUNDS[c];
    const appliedP = cfg.mode === 'min' ? b.min : (cfg.mode === 'max' ? b.max : Number(((b.min + b.max) / 2).toFixed(2)));
    const cGuideline: QssTableGuideline = {
      currentMinPct: b.min, currentMaxPct: b.max, appliedCurrentPct: appliedP, targetMinPct: 135.0, targetMaxPct: 140.0, appliedTargetPct: targetMul,
      source: 'Total of Parental Legacy', guidanceText: `Current status Values are taken ${b.min}% to ${b.max}% of the total of Parental Legacy. Target Level 135% to 140% of Current Status`
    };
    tables.push(buildTable(14 + c, `${CHAKRA_LABELS[c]} — Detailed Analysis`, 4, 'Tier 4: Granular Chakra & Kosha', CHAKRA_SUBFACTOR_LABELS[c].map((name, si) => buildRow(`chakra_detail_${c}_${si}`, name, totals[c], appliedP, targetMul, factors[c].factorId)), cGuideline));
  }

  const koshaGuideline: QssTableGuideline = {
    currentMinPct: 65.0, currentMaxPct: 65.0, appliedCurrentPct: cfg.koshasPct, targetMinPct: 135.0, targetMaxPct: 140.0, appliedTargetPct: targetMul,
    source: 'Respective Chakra Current Status', guidanceText: 'Current status Values are taken 65% of the Current Status of respective Chakra. Target Level 135% to 140% of Current Status'
  };
  tables.push(buildTable(21, '7 Koshas (Sheaths of Existence)', 4, 'Tier 4: Granular Chakra & Kosha', totals.map((t, i) => buildRow(`kosha_${i}`, KOSHA_LABELS[i], chakraRows[i].currentStatus, cfg.koshasPct, targetMul, factors[i].factorId)), koshaGuideline));
  for (let k = 0; k < 6; k++) {
    const rows = KOSHA_SUBFACTOR_LABELS[k].map((name, i) =>
      buildRow(`kosha_detail_${k}_${i}`, name, chakraRows[Math.min(i, chakraRows.length - 1)].currentStatus, cfg.koshasPct, targetMul, factors[Math.min(i, factors.length - 1)].factorId));
    tables.push(buildTable(22 + k, `${KOSHA_LABELS[k]} — Factor Analysis`, 4, 'Tier 4: Granular Chakra & Kosha', rows, koshaGuideline));
  }

  // Tier 5: Pillars, Psychological, Tridosha, Antahkarana
  const pillarGuideline: QssTableGuideline = {
    currentMinPct: 45.5, currentMaxPct: 55.5, appliedCurrentPct: cfg.pillarsPct, targetMinPct: 135.0, targetMaxPct: 140.0, appliedTargetPct: targetMul,
    source: 'Current Status of Respective Element', guidanceText: 'Current status Values are taken 45.5% to 55.5% Current Status of respective Element. Target Level 135% to 140% of Current Status'
  };
  PILLAR_LABELS.forEach(({ title, rows: rn }, pi) => tables.push(buildTable(28 + pi, title, 5, 'Tier 5: Lifestyle & Mind', rn.map((name, i) => buildRow(`pillar_${pi}_${i}`, name, elementRows[pi].currentStatus, cfg.pillarsPct, targetMul, factors[i].factorId)), pillarGuideline)));
  PSYCHOLOGICAL_LABELS.forEach(({ title, rows: rn }, pi) => tables.push(buildTable(32 + pi, title, 5, 'Tier 5: Lifestyle & Mind', rn.map((name, i) => buildRow(`psych_${pi}_${i}`, name, elementRows[4 + pi].currentStatus, cfg.pillarsPct, targetMul, factors[i].factorId)), pillarGuideline)));

  const doshaGuideline: QssTableGuideline = {
    currentMinPct: 68.5, currentMaxPct: 71.0, appliedCurrentPct: cfg.doshasAndAntahkaranaPct, targetMinPct: 135.0, targetMaxPct: 140.0, appliedTargetPct: targetMul,
    source: 'Current Status of Respective Element', guidanceText: 'Current status Values are taken 68.5% to 71% of Current Status of respective Element. Target Level 135% to 140% of Current Status'
  };
  TRIDOSHA_LABELS.forEach(({ title, rows: rn }, di) => tables.push(buildTable(35 + di, title, 5, 'Tier 5: Lifestyle & Mind', rn.map((name, i) => buildRow(`dosha_${di}_${i}`, name, elementRows[di].currentStatus, cfg.doshasAndAntahkaranaPct, targetMul, factors[i].factorId)), doshaGuideline)));
  ANTAHKARANA_LABELS.forEach(({ title, rows: rn }, ai) => tables.push(buildTable(38 + ai, title, 5, 'Tier 5: Lifestyle & Mind', rn.map((name, i) => buildRow(`antah_${ai}_${i}`, name, elementRows[3 + ai].currentStatus, cfg.doshasAndAntahkaranaPct, targetMul, factors[i].factorId)), doshaGuideline)));

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
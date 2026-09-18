import { FactorRange, FactorValue, CalculationResult } from '../types';

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

export function createPRNG(seed: number): () => number {
  let s = seed | 0;
  return function next(): number {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

export function calculateLifeFactors(dobString: string): CalculationResult {
  const validation = validateDOB(dobString);
  if (!validation.isValid || !validation.date) {
    throw new Error(validation.error || 'Invalid Date of Birth');
  }

  const date = validation.date;
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const isOddDay = day % 2 !== 0;
  const dominantParent: 'Mother' | 'Father' = isOddDay ? 'Mother' : 'Father';

  const seed = (year * 10000) + (month * 100) + day;
  const prng = createPRNG(seed);

  const dominantTargetPercent = 50.600 + (prng() * 1.800);
  const nonDominantTargetPercent = 100.000 - dominantTargetPercent;

  const targetMotherMilli = isOddDay
    ? Math.round(dominantTargetPercent * 1000)
    : Math.round(nonDominantTargetPercent * 1000);
  const targetFatherMilli = 100000 - targetMotherMilli;

  const minMilli = LIFE_FACTORS_CONFIG.map(f => Math.round(f.min * 1000));
  const capacitiesMilli = LIFE_FACTORS_CONFIG.map((f, i) => Math.round(f.max * 1000) - minMilli[i]);
  const sumMinMilli = minMilli.reduce((a, b) => a + b, 0);

  const motherResidual = allocateResidual(targetMotherMilli - sumMinMilli, capacitiesMilli);
  const fatherResidual = allocateResidual(targetFatherMilli - sumMinMilli, capacitiesMilli);

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
  const grandTotal = Number((finalMotherTotal + finalFatherTotal).toFixed(3));

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
    calculatedAt: new Date().toISOString()
  };
}
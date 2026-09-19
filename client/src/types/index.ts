export interface FactorRange {
  id: string;
  name: string;
  min: number;
  max: number;
  description: string;
}

export interface FactorValue {
  factorId: string;
  factorName: string;
  motherValue: number;
  fatherValue: number;
  totalValue: number;
  min: number;
  max: number;
  higherParent: 'Mother' | 'Father' | 'Equal';
}

// ─── QSS Multi-Tier Table System Types ─────────────────────────────────────

/** A single row inside any QSS derived table */
export interface QssTableRow {
  id: string;
  name: string;
  currentStatus: number;   // parentalTotal × 40%
  targetLevel: number;     // currentStatus × 135%
  gapToGoal: number;       // targetLevel − currentStatus
  sourceFactorId?: string; // which Parental Legacy factor it derives from
  description?: string;
}

export interface QssTableGuideline {
  currentMinPct: number;
  currentMaxPct: number;
  appliedCurrentPct: number;
  targetMinPct: number;
  targetMaxPct: number;
  appliedTargetPct: number;
  source: string;
  guidanceText: string;
}

export interface QssCalibrationConfig {
  mode: 'midpoint' | 'min' | 'max' | 'custom';
  chakraPct: number;
  auraPct: number;
  positiveKarmicPct: number;
  karmicRefinementPct: number;
  karmicBalancingPct: number;
  elementEarthPct: number;
  elementWaterPct: number;
  elementFirePct: number;
  elementAirPct: number;
  elementEtherPct: number;
  elementTimePct: number;
  elementSoulPct: number;
  koshasPct: number;
  pillarsPct: number;
  doshasAndAntahkaranaPct: number;
  targetMultiplierPct: number;
}

/** A complete QSS table (2–54) */
export interface QssTable {
  tableNumber: number;
  title: string;
  tier: 1 | 2 | 3 | 4 | 5 | 6;
  tierLabel: string;
  rows: QssTableRow[];
  totalCurrentStatus: number;
  totalTargetLevel: number;
  totalGapToGoal: number;
  guideline?: QssTableGuideline;
}

/** Sheet2 — Spiritual Observances row */
export interface SpiritualObservance {
  id: string;
  name: string;
  presentLevel: number;
  requiredLevel: number;  // present × 45%
  minimumLevel: number;   // present × 25%
}

/** Sheet3 — Vedic alternate terminology mapping */
export interface VedicMapping {
  factorId: string;
  originalName: string;
  vedicName: string;
  description: string;
}

/** 12 Cosmic Master Code card */
export interface CosmicCode {
  codeNumber: number;
  tableNumber: number;
  title: string;
  subtitle: string;
  currentStatus: number;
  targetLevel: number;
  gapToGoal: number;
  contributingFactors: string[];
  color: string;
  icon: string;
}

/** Full QSS result bundle attached to a CalculationResult */
export interface QssResult {
  tables: QssTable[];                         // Tables 2–54
  spiritualObservances: SpiritualObservance[]; // Sheet2
  vedicMappings: VedicMapping[];              // Sheet3
  cosmicCodes: CosmicCode[];                  // Tables 42–53 (12 codes)
  allCodesComparison: QssTable;               // Table 54 master comparison
  config?: QssCalibrationConfig;
}

export interface CalculationResult {
  id?: string;
  dob: string; // YYYY-MM-DD
  dayOfMonth: number;
  month: number;
  year: number;
  isOddDay: boolean;
  dominantParent: 'Mother' | 'Father';
  factors: FactorValue[];
  motherTotal: number;
  fatherTotal: number;
  grandTotal: number; // Invariant: 100.000
  calculatedAt: string;
  qss?: QssResult;   // Full QSS multi-tier analysis (populated after calculation)
}

export interface User {
  id: string;
  name: string;
  email: string;
  preferences?: {
    theme?: 'dark' | 'light';
    defaultExportFormat?: 'pdf' | 'csv';
  };
  createdAt?: string;
  stats?: {
    totalCalculations: number;
    motherDominantCount: number;
    fatherDominantCount: number;
  };
}

export interface HistoryItemSummary {
  id: string;
  dob: string;
  dayOfMonth: number;
  isOddDay: boolean;
  dominantParent: 'Mother' | 'Father';
  motherTotal: number;
  fatherTotal: number;
  grandTotal: number;
  createdAt: string;
}

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

export interface QssTableRow {
  id: string;
  name: string;
  currentStatus: number;
  targetLevel: number;
  gapToGoal: number;
  sourceFactorId?: string;
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

export interface SpiritualObservance {
  id: string;
  name: string;
  presentLevel: number;
  requiredLevel: number;
  minimumLevel: number;
}

export interface VedicMapping {
  factorId: string;
  originalName: string;
  vedicName: string;
  description: string;
}

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

export interface QssResult {
  tables: QssTable[];
  spiritualObservances: SpiritualObservance[];
  vedicMappings: VedicMapping[];
  cosmicCodes: CosmicCode[];
  allCodesComparison: QssTable;
  config?: QssCalibrationConfig;
}

export interface CalculationResult {
  dob: string; // YYYY-MM-DD
  dayOfMonth: number;
  month: number;
  year: number;
  isOddDay: boolean;
  dominantParent: 'Mother' | 'Father';
  factors: FactorValue[];
  motherTotal: number;
  fatherTotal: number;
  grandTotal: number; // strictly 100.000
  calculatedAt: string;
  qss?: QssResult;   // Full QSS multi-tier analysis
}


export interface SafeUser {
  id: string;
  name: string;
  email: string;
  preferences: {
    theme: 'dark' | 'light';
    defaultExportFormat: 'pdf' | 'csv';
  };
  createdAt: string;
}

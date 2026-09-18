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

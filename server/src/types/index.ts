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

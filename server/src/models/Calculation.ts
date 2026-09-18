import mongoose, { Document, Schema } from 'mongoose';
import { FactorValue } from '../types/index.js';

export interface ICalculation extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  guestSessionId?: string;
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
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FactorValueSchema = new Schema<FactorValue>(
  {
    factorId: { type: String, required: true },
    factorName: { type: String, required: true },
    motherValue: { type: Number, required: true },
    fatherValue: { type: Number, required: true },
    totalValue: { type: Number, required: true },
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    higherParent: { type: String, enum: ['Mother', 'Father', 'Equal'], required: true }
  },
  { _id: false }
);

const CalculationSchema = new Schema<ICalculation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true, default: null },
    guestSessionId: { type: String, index: true, default: null },
    dob: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    dayOfMonth: { type: Number, required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    isOddDay: { type: Boolean, required: true },
    dominantParent: { type: String, enum: ['Mother', 'Father'], required: true },
    factors: { type: [FactorValueSchema], required: true },
    motherTotal: { type: Number, required: true },
    fatherTotal: { type: Number, required: true },
    grandTotal: { type: Number, required: true, default: 100.000 },
    notes: { type: String, maxlength: 500 }
  },
  { timestamps: true }
);

// Compound indexes for sub-10ms queries
CalculationSchema.index({ userId: 1, createdAt: -1 });
CalculationSchema.index({ guestSessionId: 1, createdAt: -1 });
CalculationSchema.index({ dob: 1, createdAt: -1 });

export const Calculation = mongoose.model<ICalculation>('Calculation', CalculationSchema);

import { describe, it, expect } from 'vitest';
import { calculateLifeFactors, validateDOB } from '../src/services/calculatorEngine.js';

describe('Calculator Engine Unit Tests', () => {
  describe('DOB Validation', () => {
    it('should validate standard past dates', () => {
      const res = validateDOB('1995-03-15');
      expect(res.isValid).toBe(true);
      expect(res.date).toBeDefined();
    });

    it('should reject future dates', () => {
      const res = validateDOB('2099-01-01');
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/future/i);
    });

    it('should reject invalid calendar dates like Feb 30', () => {
      const res = validateDOB('1995-02-30');
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/invalid calendar date/i);
    });

    it('should reject non-leap year Feb 29', () => {
      const res = validateDOB('2023-02-29');
      expect(res.isValid).toBe(false);
    });

    it('should accept leap year Feb 29', () => {
      const res = validateDOB('2024-02-29');
      expect(res.isValid).toBe(true);
    });
  });

  describe('Mathematical Invariants & Grand Total 100.000', () => {
    it('should satisfy Grand Total = 100.000 on an Odd Day (Mother dominant)', () => {
      const result = calculateLifeFactors('1995-03-15'); // 15 is odd
      expect(result.isOddDay).toBe(true);
      expect(result.dominantParent).toBe('Mother');
      expect(result.motherTotal).toBeGreaterThan(result.fatherTotal);
      expect(result.grandTotal).toBe(100.000);
      expect(Number((result.motherTotal + result.fatherTotal).toFixed(3))).toBe(100.000);
    });

    it('should satisfy Grand Total = 100.000 on an Even Day (Father dominant)', () => {
      const result = calculateLifeFactors('1992-06-24'); // 24 is even
      expect(result.isOddDay).toBe(false);
      expect(result.dominantParent).toBe('Father');
      expect(result.fatherTotal).toBeGreaterThan(result.motherTotal);
      expect(result.grandTotal).toBe(100.000);
      expect(Number((result.motherTotal + result.fatherTotal).toFixed(3))).toBe(100.000);
    });

    it('should ensure Mother_i + Father_i = Total_i for every factor', () => {
      const result = calculateLifeFactors('1988-11-03');
      for (const factor of result.factors) {
        const sum = Number((factor.motherValue + factor.fatherValue).toFixed(3));
        expect(sum).toBe(factor.totalValue);
      }
    });

    it('should be 100% deterministic (same DOB yields identical output)', () => {
      const run1 = calculateLifeFactors('2001-07-19');
      const run2 = calculateLifeFactors('2001-07-19');
      expect(run1.motherTotal).toBe(run2.motherTotal);
      expect(run1.fatherTotal).toBe(run2.fatherTotal);
      expect(run1.factors).toEqual(run2.factors);
    });

    it('should satisfy 100.000 grand total across every day of a 366-day leap year', () => {
      // Sweep through 2024 (leap year = 366 days)
      const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= daysInMonth[m]; d++) {
          const monthStr = String(m + 1).padStart(2, '0');
          const dayStr = String(d).padStart(2, '0');
          const dob = `2024-${monthStr}-${dayStr}`;
          const res = calculateLifeFactors(dob);

          expect(res.grandTotal).toBe(100.000);
          expect(Number((res.motherTotal + res.fatherTotal).toFixed(3))).toBe(100.000);

          if (d % 2 !== 0) {
            expect(res.isOddDay).toBe(true);
            expect(res.motherTotal).toBeGreaterThan(res.fatherTotal);
          } else {
            expect(res.isOddDay).toBe(false);
            expect(res.fatherTotal).toBeGreaterThan(res.motherTotal);
          }

          // Factor bounds: every Mother/Father value stays within [min, max]
          for (const f of res.factors) {
            expect(f.motherValue).toBeGreaterThanOrEqual(f.min);
            expect(f.motherValue).toBeLessThanOrEqual(f.max);
            expect(f.fatherValue).toBeGreaterThanOrEqual(f.min);
            expect(f.fatherValue).toBeLessThanOrEqual(f.max);
          }
        }
      }
    });
  });
});

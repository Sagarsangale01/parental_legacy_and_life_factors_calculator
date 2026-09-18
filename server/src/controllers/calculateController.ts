import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { calculateLifeFactors, validateDOB } from '../services/calculatorEngine.js';
import { Calculation } from '../models/Calculation.js';

export const calculate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { dob, save = true, guestSessionId, notes } = req.body;

    if (!dob) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_DOB', message: 'Date of Birth (dob) is required in YYYY-MM-DD format.' }
      });
      return;
    }

    const validation = validateDOB(dob);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_DOB', message: validation.error || 'Invalid Date of Birth.' }
      });
      return;
    }

    const calculated = calculateLifeFactors(dob);

    let savedDocumentId: string | null = null;

    if (save) {
      // Persist to MongoDB
      const newCalc = await Calculation.create({
        userId: req.user ? req.user.id : null,
        guestSessionId: req.user ? null : guestSessionId || null,
        dob: calculated.dob,
        dayOfMonth: calculated.dayOfMonth,
        month: calculated.month,
        year: calculated.year,
        isOddDay: calculated.isOddDay,
        dominantParent: calculated.dominantParent,
        factors: calculated.factors,
        motherTotal: calculated.motherTotal,
        fatherTotal: calculated.fatherTotal,
        grandTotal: calculated.grandTotal,
        notes
      });
      savedDocumentId = newCalc._id.toString();
    }

    res.status(200).json({
      success: true,
      data: {
        id: savedDocumentId,
        ...calculated
      }
    });
  } catch (error) {
    next(error);
  }
};

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Calculation } from '../models/Calculation.js';

export const getHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const skip = (page - 1) * limit;

    const guestSessionId = req.query.guestSessionId as string;

    // Filter by user ID if logged in; otherwise by guestSessionId
    const filter: any = {};
    if (req.user) {
      filter.userId = req.user.id;
    } else if (guestSessionId) {
      filter.guestSessionId = guestSessionId;
    } else {
      // Return empty if neither is provided
      res.status(200).json({
        success: true,
        data: {
          calculations: [],
          pagination: { total: 0, page, limit, pages: 0 }
        }
      });
      return;
    }

    const total = await Calculation.countDocuments(filter);
    const calculations = await Calculation.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        calculations: calculations.map(c => ({
          id: c._id.toString(),
          dob: c.dob,
          dayOfMonth: c.dayOfMonth,
          isOddDay: c.isOddDay,
          dominantParent: c.dominantParent,
          motherTotal: c.motherTotal,
          fatherTotal: c.fatherTotal,
          grandTotal: c.grandTotal,
          createdAt: c.createdAt
        })),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCalculationById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const calculation = await Calculation.findById(id).lean();
    if (!calculation) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Calculation record not found.' }
      });
      return;
    }

    // Security check: if calculation belongs to a user, verify ownership
    if (calculation.userId && (!req.user || req.user.id !== calculation.userId.toString())) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to view this record.' }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: calculation._id.toString(),
        dob: calculation.dob,
        dayOfMonth: calculation.dayOfMonth,
        month: calculation.month,
        year: calculation.year,
        isOddDay: calculation.isOddDay,
        dominantParent: calculation.dominantParent,
        factors: calculation.factors,
        motherTotal: calculation.motherTotal,
        fatherTotal: calculation.fatherTotal,
        grandTotal: calculation.grandTotal,
        notes: calculation.notes,
        createdAt: calculation.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCalculation = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const calculation = await Calculation.findById(id);
    if (!calculation) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Calculation record not found.' }
      });
      return;
    }

    // Ownership check: user-bound records require the owning user; guest
    // records may only be deleted when the caller proves the matching session.
    const ownerId = calculation.userId ? calculation.userId.toString() : null;
    const isOwner = !!req.user && ownerId === req.user.id;
    const isGuestSessionMatch =
      !ownerId &&
      !!calculation.guestSessionId &&
      !!req.body?.guestSessionId &&
      req.body.guestSessionId === calculation.guestSessionId;

    if (!isOwner && !isGuestSessionMatch) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to delete this record.' }
      });
      return;
    }

    await Calculation.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      data: { message: 'Calculation deleted successfully.' }
    });
  } catch (error) {
    next(error);
  }
};

export const exportCSV = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const calculation = await Calculation.findById(id).lean();
    if (!calculation) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Calculation record not found.' }
      });
      return;
    }

    // Ownership check: user-bound records require the owning user; guest
    // records may only be exported when the caller proves the matching session.
    const ownerId = calculation.userId ? calculation.userId.toString() : null;
    const isOwner = !!req.user && ownerId === req.user.id;
    const isGuestSessionMatch =
      !ownerId &&
      !!calculation.guestSessionId &&
      !!req.query.guestSessionId &&
      req.query.guestSessionId === calculation.guestSessionId;

    if (!isOwner && !isGuestSessionMatch) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to export this record.' }
      });
      return;
    }

    // Build RFC 4180 compliant CSV
    const rows: string[] = [];
    rows.push('PARENTAL LEGACY & LIFE FACTORS CALCULATOR');
    rows.push(`Date of Birth: ${calculation.dob},Dominant Parent: ${calculation.dominantParent} (Day ${calculation.dayOfMonth} is ${calculation.isOddDay ? 'Odd' : 'Even'})`);
    rows.push('');
    rows.push('LIFE FACTORS,MOTHER,FATHER,TOTAL,Minimum,Maximum');

    for (const f of calculation.factors) {
      rows.push(`"${f.factorName}",${f.motherValue.toFixed(3)},${f.fatherValue.toFixed(3)},${f.totalValue.toFixed(3)},${f.min.toFixed(3)},${f.max.toFixed(3)}`);
    }

    rows.push(`TOTAL,${calculation.motherTotal.toFixed(3)},${calculation.fatherTotal.toFixed(3)},${calculation.grandTotal.toFixed(3)},47.121,54.230`);

    const csvContent = rows.join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Parental_Legacy_${calculation.dob}.csv"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

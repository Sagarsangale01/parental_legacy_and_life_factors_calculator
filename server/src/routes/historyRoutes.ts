import { Router } from 'express';
import { getHistory, getCalculationById, deleteCalculation, exportCSV } from '../controllers/historyController.js';
import { optionalAuth, protect } from '../middleware/authMiddleware.js';

const router = Router();

// History listing (works for both user and guestSessionId)
router.get('/', optionalAuth, getHistory);
router.get('/:id', optionalAuth, getCalculationById);
router.delete('/:id', protect, deleteCalculation);
router.get('/:id/csv', optionalAuth, exportCSV);

export default router;

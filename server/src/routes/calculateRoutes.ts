import { Router } from 'express';
import { calculate } from '../controllers/calculateController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Calculate life factors (supports both authenticated and guest users)
router.post('/', optionalAuth, calculate);

export default router;

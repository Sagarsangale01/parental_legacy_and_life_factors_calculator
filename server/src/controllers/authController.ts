import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Calculation } from '../models/Calculation.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { getJwtSecret, getJwtExpiresIn } from '../config/env.js';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+={}\[\]:;"'<>,.?\/\\~`|-])[A-Za-z\d@$!%*?&#^()_+={}\[\]:;"'<>,.?\/\\~`|-]{8,}$/;

function generateToken(user: any): string {
  const secret = getJwtSecret();
  const expiresIn = getJwtExpiresIn();

  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      name: user.name
    },
    secret,
    { expiresIn: expiresIn as any }
  );
}

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name, email, and password are all required.' }
      });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!PASSWORD_REGEX.test(password)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
        }
      });
      return;
    }

    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: { code: 'EMAIL_EXISTS', message: 'An account with this email address already exists.' }
      });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      passwordHash
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          preferences: newUser.preferences,
          createdAt: newUser.createdAt.toISOString()
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Both email and password are required.' }
      });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Explicitly query passwordHash since it is marked select: false
    const user = await User.findOne({ email: trimmedEmail }).select('+passwordHash');
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
      });
      return;
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          preferences: user.preferences,
          createdAt: user.createdAt.toISOString()
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not logged in' } });
      return;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      return;
    }

    const totalCalculations = await Calculation.countDocuments({ userId: user._id });
    const motherDominantCount = await Calculation.countDocuments({ userId: user._id, dominantParent: 'Mother' });
    const fatherDominantCount = await Calculation.countDocuments({ userId: user._id, dominantParent: 'Father' });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          preferences: user.preferences,
          createdAt: user.createdAt.toISOString(),
          stats: {
            totalCalculations,
            motherDominantCount,
            fatherDominantCount
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const claimGuestRecords = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const { guestSessionId } = req.body;
    if (!guestSessionId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'guestSessionId required' } });
      return;
    }

    const updateResult = await Calculation.updateMany(
      { guestSessionId, userId: null },
      { $set: { userId: req.user.id, guestSessionId: null } }
    );

    res.status(200).json({
      success: true,
      data: {
        claimedCount: updateResult.modifiedCount,
        message: `Successfully claimed ${updateResult.modifiedCount} calculations.`
      }
    });
  } catch (error) {
    next(error);
  }
};

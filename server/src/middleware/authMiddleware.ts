import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { getJwtSecret } from '../config/env.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication token is required to access this resource.'
      }
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as {
      sub: string;
      email: string;
      name: string;
    };

    const user = await User.findById(decoded.sub).select('_id email name');
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The user account associated with this token no longer exists.'
        }
      });
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name
    };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Your session has expired. Please sign in again.'
        }
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'The authentication token provided is invalid or malformed.'
      }
    });
  }
};

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, getJwtSecret()) as any;
      const user = await User.findById(decoded.sub).select('_id email name');
      if (user) {
        req.user = {
          id: user._id.toString(),
          email: user.email,
          name: user.name
        };
      }
    } catch {
      // Ignored for guest access
    }
  }
  next();
};

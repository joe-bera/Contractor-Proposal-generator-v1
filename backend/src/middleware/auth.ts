import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';
import prisma from '../db/client.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  companyId?: string;
  userRole?: string;
  clerkUserId?: string;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header'
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify the JWT token with Clerk
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    if (!payload || !payload.sub) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
      return;
    }

    // Find the user in our database
    const user = await prisma.user.findUnique({
      where: { clerkId: payload.sub },
      include: { company: true },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found. Please complete registration.'
      });
      return;
    }

    // Attach user info to request
    req.userId = user.id;
    req.companyId = user.companyId;
    req.userRole = user.role;
    req.clerkUserId = payload.sub;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

// Optional auth - doesn't require authentication but attaches user if present
export async function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  // If there's a token, try to authenticate
  await authMiddleware(req, res, next);
}

// Role-based access control middleware
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }
    next();
  };
}

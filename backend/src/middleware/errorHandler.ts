import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // Unique constraint violation
        res.status(409).json({
          success: false,
          error: 'A record with this value already exists',
        });
        return;
      case 'P2025': // Record not found
        res.status(404).json({
          success: false,
          error: 'Record not found',
        });
        return;
      case 'P2003': // Foreign key constraint
        res.status(400).json({
          success: false,
          error: 'Related record not found',
        });
        return;
      default:
        res.status(500).json({
          success: false,
          error: 'Database error',
        });
        return;
    }
  }

  // Custom operational errors
  if (err.isOperational) {
    res.status(err.statusCode || 400).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Unexpected errors
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'An unexpected error occurred',
  });
}

// Create a custom error with status code
export function createError(message: string, statusCode: number): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

// Not found handler
export function notFoundHandler(
  req: Request,
  res: Response
): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
}

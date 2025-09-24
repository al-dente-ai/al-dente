import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../logger';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request body validation failed',
            details: validationErrors,
          },
        });
        return;
      }

      logger.error('Body validation middleware error', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Validation failed',
        },
      });
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Query parameters validation failed',
            details: validationErrors,
          },
        });
        return;
      }

      logger.error('Query validation middleware error', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Validation failed',
        },
      });
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Path parameters validation failed',
            details: validationErrors,
          },
        });
        return;
      }

      logger.error('Params validation middleware error', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Validation failed',
        },
      });
    }
  };
}

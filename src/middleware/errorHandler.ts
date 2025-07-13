import { Request,RequestHandler, Response, NextFunction } from 'express';
import { HttpError } from 'http-errors';

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
}

const errorHandler:RequestHandler = (
  err: ErrorWithStatus | HttpError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (res.headersSent) {
    return next(err);
  }

  let status = 500;
  let message = 'Internal Server Error';

  if (err.status) {
    status = err.status;
    message = err.message;
  } else if (err.statusCode) {
    status = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID format';
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      status,
      url: req.url,
      method: req.method,
    });
  }

  res.status(status).json({
    error: {
      message,
      status,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err.message
      })
    }
  });
};

export default errorHandler;

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(resource: string): AppError {
    return new AppError(`${resource} not found`, 404);
  }

  static badRequest(message: string): AppError {
    return new AppError(message, 400);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409);
  }

  static unauthorized(): AppError {
    return new AppError('Unauthorized', 401);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(message, 500, false);
  }
}

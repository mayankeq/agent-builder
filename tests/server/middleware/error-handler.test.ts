import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// Mock error handler middleware
const createMockErrorHandler = () => {
  return (err: Error, req: Request, res: Response, _next: NextFunction) => {
    // Log error (in real middleware)
    console.error('Error:', err.message);

    // Determine status code
    let statusCode = 500;
    if ((err as any).statusCode) {
      statusCode = (err as any).statusCode;
    } else if (err.name === 'ValidationError') {
      statusCode = 400;
    } else if (err.name === 'UnauthorizedError') {
      statusCode = 401;
    } else if (err.name === 'NotFoundError') {
      statusCode = 404;
    }

    // Send response
    res.status(statusCode).json({
      error: {
        message: err.message,
        type: err.name,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
    });
  };
};

describe('Error Handler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let errorHandler: ReturnType<typeof createMockErrorHandler>;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/test',
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
    errorHandler = createMockErrorHandler();

    // Spy on console.error
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('generic errors', () => {
    it('should handle generic error with 500 status', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Something went wrong',
          type: 'Error',
        },
      });
    });

    it('should log error to console', () => {
      const error = new Error('Test error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(console.error).toHaveBeenCalledWith('Error:', 'Test error');
    });
  });

  describe('custom status codes', () => {
    it('should use custom status code from error', () => {
      const error: any = new Error('Bad request');
      error.statusCode = 400;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle 404 errors', () => {
      const error: any = new Error('Not found');
      error.statusCode = 404;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Not found',
          type: 'Error',
        },
      });
    });

    it('should handle 401 errors', () => {
      const error: any = new Error('Unauthorized');
      error.statusCode = 401;

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('error types', () => {
    it('should handle ValidationError with 400', () => {
      const error = new Error('Invalid input');
      error.name = 'ValidationError';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          message: 'Invalid input',
          type: 'ValidationError',
        },
      });
    });

    it('should handle UnauthorizedError with 401', () => {
      const error = new Error('Not authorized');
      error.name = 'UnauthorizedError';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should handle NotFoundError with 404', () => {
      const error = new Error('Resource not found');
      error.name = 'NotFoundError';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('error response format', () => {
    it('should include error message', () => {
      const error = new Error('Test message');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Test message',
          }),
        })
      );
    });

    it('should include error type', () => {
      const error = new Error('Test');
      error.name = 'CustomError';

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            type: 'CustomError',
          }),
        })
      );
    });

    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Dev error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            stack: expect.any(String),
          }),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Prod error');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      const jsonCall = (mockRes.json as any).mock.calls[0][0];
      expect(jsonCall.error.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('error scenarios', () => {
    it('should handle errors with no message', () => {
      const error = new Error();

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle errors with very long messages', () => {
      const longMessage = 'x'.repeat(10000);
      const error = new Error(longMessage);

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: longMessage,
          }),
        })
      );
    });

    it('should handle errors with special characters', () => {
      const error = new Error('Error with "quotes" and <tags>');

      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Error with "quotes" and <tags>',
          }),
        })
      );
    });
  });

  describe('request context', () => {
    it('should handle errors from different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      methods.forEach(method => {
        mockReq.method = method;
        const error = new Error(`Error in ${method}`);

        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalled();
      });
    });

    it('should handle errors from different paths', () => {
      const paths = ['/api/users', '/api/sessions', '/api/agents'];

      paths.forEach(path => {
        mockReq.path = path;
        const error = new Error(`Error at ${path}`);

        errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalled();
      });
    });
  });
});

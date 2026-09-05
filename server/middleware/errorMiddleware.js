const { logAuthorizationFailure } = require('./auditLogger');

// Not found middleware
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    // Determine status code
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
    } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        statusCode = 401;
    } else if (err.name === 'ForbiddenError') {
        statusCode = 403;
    }

    // Log error server-side (never expose to client)
    console.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        user: req.user?.id || 'anonymous'
    });

    // Prepare user-friendly error response
    const errorResponse = {
        message: getUserFriendlyMessage(err, statusCode),
        ...(err.code && { code: err.code })
    };

    // Only include stack trace in development
    if (process.env.NODE_ENV !== 'production') {
        errorResponse.stack = err.stack;
        errorResponse.originalMessage = err.message;
    }

    res.status(statusCode).json(errorResponse);
};

/**
 * Get user-friendly error message
 */
const getUserFriendlyMessage = (err, statusCode) => {
    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production') {
        switch (statusCode) {
            case 400:
                return 'Invalid request. Please check your input and try again.';
            case 401:
                return 'Authentication required. Please sign in and try again.';
            case 403:
                return 'You do not have permission to perform this action.';
            case 404:
                return 'The requested resource was not found.';
            case 409:
                return 'This action conflicts with existing data.';
            case 429:
                return 'Too many requests. Please try again later.';
            case 500:
            default:
                return 'An unexpected error occurred. Please try again later.';
        }
    }

    // In development, return actual error message
    return err.message;
};

// Database error handler
const handleDatabaseError = (error) => {
    console.error('Database Error:', error);

    // PostgreSQL error codes
    switch (error.code) {
        case '23505': // Unique violation
            return {
                status: 409,
                message: 'A record with this information already exists',
                code: 'DUPLICATE_ENTRY'
            };
        case '23503': // Foreign key violation
            return {
                status: 400,
                message: 'Referenced record does not exist',
                code: 'INVALID_REFERENCE'
            };
        case '23502': // Not null violation
            return {
                status: 400,
                message: 'Required field is missing',
                code: 'MISSING_REQUIRED_FIELD'
            };
        case '22P02': // Invalid text representation
            return {
                status: 400,
                message: 'Invalid data format',
                code: 'INVALID_FORMAT'
            };
        case '42P01': // Undefined table
            return {
                status: 500,
                message: process.env.NODE_ENV === 'production'
                    ? 'A database error occurred'
                    : 'Database table not found',
                code: 'DATABASE_ERROR'
            };
        case '08006': // Connection failure
        case '08003': // Connection does not exist
            return {
                status: 503,
                message: 'Database connection error. Please try again later.',
                code: 'DATABASE_UNAVAILABLE'
            };
        default:
            return {
                status: 500,
                message: process.env.NODE_ENV === 'production'
                    ? 'A database error occurred'
                    : `Database error: ${error.message}`,
                code: 'DATABASE_ERROR'
            };
    }
};

// Async handler wrapper to catch errors in async route handlers
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Handle validation errors from express-validator
 */
const handleValidationError = (errors) => {
    const formattedErrors = errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
    }));

    return {
        status: 400,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: formattedErrors
    };
};

module.exports = {
    notFound,
    errorHandler,
    handleDatabaseError,
    asyncHandler,
    handleValidationError,
    getUserFriendlyMessage
};

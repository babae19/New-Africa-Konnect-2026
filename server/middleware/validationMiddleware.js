const { body, param, query, validationResult } = require('express-validator');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Create DOMPurify instance for server-side sanitization
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: `Validation failed at ${req.originalUrl}`,
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        });
    }
    next();
};

/**
 * Sanitize HTML input to prevent XSS
 */
const sanitizeHtml = (value) => {
    if (typeof value !== 'string') return value;
    return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] }); // Strip all HTML
};

/**
 * Custom sanitizer for text fields
 */
const sanitizeText = (value) => {
    if (typeof value !== 'string') return value;
    return sanitizeHtml(value).trim();
};

/**
 * Validation rules for user registration
 */
const validateRegister = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
        .customSanitizer(sanitizeText),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail()
        .isLength({ max: 255 }).withMessage('Email must not exceed 255 characters'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role')
        .optional()
        .isIn(['client', 'expert', 'admin']).withMessage('Role must be client, expert, or admin'),
    validate
];

/**
 * Validation rules for user login
 */
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
    validate
];

/**
 * Validation rules for project creation
 */
const validateProject = [
    body('title')
        .trim()
        .notEmpty().withMessage('Project title is required')
        .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters')
        .customSanitizer(sanitizeText),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 5000 }).withMessage('Description must not exceed 5000 characters')
        .customSanitizer(sanitizeText),
    body('budget')
        .optional()
        .isFloat({ min: 0 }).withMessage('Budget must be a positive number')
        .toFloat(),
    body('status')
        .optional()
        .isIn(['draft', 'posted', 'matched', 'contracted', 'active', 'completed', 'archived'])
        .withMessage('Invalid project status'),
    body('techStack')
        .optional()
        .isArray().withMessage('Tech stack must be an array'),
    validate
];

/**
 * Validation rules for contract creation
 */
/**
 * Validation rules for contract creation
 */
const validateContract = [
    body('projectId')
        .notEmpty().withMessage('Project ID is required')
        .isUUID().withMessage('Invalid Project ID format'),
    body('expertId')
        .notEmpty().withMessage('Expert ID is required')
        .isUUID().withMessage('Invalid Expert ID format'),
    body('terms')
        .optional({ nullable: true, checkFalsy: true })
        .trim()
        .isLength({ max: 10000 }).withMessage('Terms must not exceed 10000 characters')
        .customSanitizer(sanitizeText),
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0 }).withMessage('Amount must be a positive number')
        .toFloat(),
    validate
];

/**
 * Validation rules for expert profile
 */
const validateExpertProfile = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters')
        .customSanitizer(sanitizeText),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Bio must not exceed 2000 characters')
        .customSanitizer(sanitizeText),
    body('skills')
        .optional()
        .isArray().withMessage('Skills must be an array'),
    body('hourlyRate')
        .optional()
        .isFloat({ min: 0 }).withMessage('Hourly rate must be a positive number')
        .toFloat(),
    body('location')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('Location must not exceed 100 characters')
        .customSanitizer(sanitizeText),
    body('certifications')
        .optional()
        .isArray().withMessage('Certifications must be an array'),
    body('availability')
        .optional()
        .isIn(['available', 'busy', 'unavailable']).withMessage('Invalid availability status'),
    validate
];

/**
 * Validation rules for messages
 */
const validateMessage = [
    body('content')
        .trim()
        .notEmpty().withMessage('Message content is required')
        .isLength({ min: 1, max: 5000 }).withMessage('Message must be between 1 and 5000 characters')
        .customSanitizer(sanitizeText),
    body('projectId')
        .optional({ nullable: true, checkFalsy: true })
        .isUUID().withMessage('Invalid Project ID format'),
    body('receiverId')
        .optional({ nullable: true, checkFalsy: true })
        .isUUID().withMessage('Invalid Receiver ID format'),
    body().custom((value, { req }) => {
        if (!req.body.projectId && !req.body.receiverId) {
            throw new Error('Either Project ID or Receiver ID is required');
        }
        return true;
    }),
    validate
];

/**
 * Validation rules for payment/escrow
 */
const validatePayment = [
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0.01 }).withMessage('Amount must be at least 0.01')
        .toFloat(),
    body('projectId')
        .notEmpty().withMessage('Project ID is required')
        .isUUID().withMessage('Invalid Project ID format'),
    validate
];

/**
 * Validation rules for ID parameters
 */
/**
 * Validation rules for ID parameters
 */
const validateId = [
    param('id')
        .optional({ nullable: true, checkFalsy: true })
        .isUUID().withMessage('Invalid ID format'),
    param('projectId')
        .optional({ nullable: true, checkFalsy: true })
        .isUUID().withMessage('Invalid Project ID format'),
    validate
];

/**
 * Sanitize request body recursively
 */
const sanitizeBody = (req, res, next) => {
    const sanitizeObject = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                obj[key] = sanitizeText(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body && typeof req.body === 'object') {
        sanitizeObject(req.body);
    }

    next();
};

module.exports = {
    validate,
    sanitizeHtml,
    sanitizeText,
    sanitizeBody,
    validateRegister,
    validateLogin,
    validateProject,
    validateContract,
    validateExpertProfile,
    validateMessage,
    validatePayment,
    validateId
};

import { body, validationResult } from 'express-validator';

export const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('Username or ABHA ID is required')
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

export const validateRegister = [
  body('name')
    .notEmpty()
    .withMessage('Patient name is required')
    .trim(),
  body('abha')
    .isLength({ min: 14, max: 14 })
    .withMessage('ABHA ID must be exactly 14 digits')
    .isNumeric()
    .withMessage('ABHA ID must be numeric'),
  body('phone')
    .isLength({ min: 10, max: 10 })
    .withMessage('Phone number must be exactly 10 digits')
    .isNumeric()
    .withMessage('Phone number must contain only numbers'),
  body('dob')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Date of birth must be a valid ISO8601 date (YYYY-MM-DD)'),
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

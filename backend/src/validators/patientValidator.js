import { body, validationResult } from 'express-validator';

export const validatePatientUpdate = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .trim(),
  body('phone')
    .optional()
    .isLength({ min: 10, max: 10 })
    .withMessage('Phone number must be exactly 10 digits'),
  body('status')
    .optional()
    .isIn(['Active', 'Discharged', 'In-Treatment'])
    .withMessage('Status must be Active, Discharged, or In-Treatment'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

export const validateEMRUpdate = [
  body('vitals')
    .optional()
    .isArray()
    .withMessage('Vitals must be an array'),
  body('allergies')
    .optional()
    .isArray()
    .withMessage('Allergies must be an array'),
  body('diagnoses')
    .optional()
    .isArray()
    .withMessage('Diagnoses must be an array'),
  body('surgeries')
    .optional()
    .isArray()
    .withMessage('Surgeries must be an array'),
  body('labReports')
    .optional()
    .isArray()
    .withMessage('Lab reports must be an array'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

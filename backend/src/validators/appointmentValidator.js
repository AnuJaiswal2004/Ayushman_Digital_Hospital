import { body, validationResult } from 'express-validator';

export const validateAppointmentBooking = [
  body('patientId')
    .notEmpty()
    .withMessage('Patient ID is required'),
  body('doctor')
    .notEmpty()
    .withMessage('Doctor name is required'),
  body('department')
    .notEmpty()
    .withMessage('Department name is required'),
  body('date')
    .notEmpty()
    .withMessage('Date is required'),
  body('time')
    .notEmpty()
    .withMessage('Time is required'),
  body('type')
    .isIn(['opd', 'telemedicine', 'emergency'])
    .withMessage('Type must be opd, telemedicine, or emergency'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

export const validateCheckIn = [
  body('patientId')
    .notEmpty()
    .withMessage('Patient ID is required'),
  body('doctorName')
    .notEmpty()
    .withMessage('Doctor name is required'),
  body('department')
    .notEmpty()
    .withMessage('Department is required'),
  body('type')
    .isIn(['opd', 'telemedicine', 'emergency'])
    .withMessage('Type must be opd, telemedicine, or emergency'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

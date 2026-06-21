import { body, validationResult } from 'express-validator';

export const validateBillingPayment = [
  body('paymentMethod')
    .isIn(['cash', 'card', 'upi', 'insurance'])
    .withMessage('Payment method must be cash, card, upi, or insurance'),
  body('totalAmount')
    .isNumeric()
    .withMessage('Total amount must be a number')
    .custom((value) => value >= 0)
    .withMessage('Total amount cannot be negative'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

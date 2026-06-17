// Central export file for all models

const Patient = require('./Patient');
const Visit = require('./Visit');
const Department = require('./Department');
const Counter = require('./Counter');
const Staff = require('./Staff');
const Vital = require('./Vital');
const Consultation = require('./Consultation');
const LabOrder = require('./LabOrder');
const LabSample = require('./LabSample');
const LabResult = require('./LabResult');
const Prescription = require('./Prescription');
const PrescriptionItem = require('./PrescriptionItem');
const Drug = require('./Drug');
const Inventory = require('./Inventory');
const PharmacyOrder = require('./PharmacyOrder');
const Bill = require('./Bill');
const Payment = require('./Payment');
const Document = require('./Document');
const QueueCounter = require('./QueueCounter');
const EventLog = require('./EventLog');
const AiDecision = require('./AiDecision');
const UserAccount = require('./UserAccount');
const AuditLog = require('./AuditLog');

module.exports = {
  Patient,
  Visit,
  Department,
  Counter,
  Staff,
  Vital,
  Consultation,
  LabOrder,
  LabSample,
  LabResult,
  Prescription,
  PrescriptionItem,
  Drug,
  Inventory,
  PharmacyOrder,
  Bill,
  Payment,
  Document,
  QueueCounter,
  EventLog,
  AiDecision,
  UserAccount,
  AuditLog
};

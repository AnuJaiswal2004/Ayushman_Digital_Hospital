const express = require('express');
const router = express.Router();
const { Patient, Visit } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Get all patients
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find().sort({ created_at: -1 });
    res.json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get patient by ID
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findOne({ patient_id: req.params.id });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get patient by ABHA ID
router.get('/abha/:abhaId', async (req, res) => {
  try {
    const patient = await Patient.findOne({ abha_id: req.params.abhaId });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new patient
router.post('/', async (req, res) => {
  try {
    const { name, phone, abha_id, dob, address, consent_for_notifications } = req.body;

    // Validate required fields
    if (!name || !phone || !abha_id || !dob) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields: name, phone, abha_id, dob'
      });
    }

    // Check if patient already exists
    const existingPatient = await Patient.findOne({ 
      $or: [{ abha_id }, { phone }]
    });

    if (existingPatient) {
      return res.status(409).json({
        success: false,
        error: 'Patient with this ABHA ID or phone number already exists'
      });
    }

    // Generate patient ID
    const patientCount = await Patient.countDocuments();
    const patient_id = `PAT${String(patientCount + 1).padStart(5, '0')}`;

    // Create new patient
    const patient = await Patient.create({
      patient_id,
      name,
      phone,
      abha_id,
      dob,
      address,
      consent_for_notifications
    });

    res.status(201).json({
      success: true,
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update patient
router.put('/:id', async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { patient_id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get patient visits
router.get('/:id/visits', async (req, res) => {
  try {
    const visits = await Visit.find({ patient_id: req.params.id })
      .sort({ created_at: -1 });

    res.json({
      success: true,
      count: visits.length,
      data: visits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete patient (soft delete - not recommended in production)
router.delete('/:id', async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({ patient_id: req.params.id });

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

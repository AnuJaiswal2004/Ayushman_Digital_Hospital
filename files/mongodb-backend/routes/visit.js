const express = require('express');
const router = express.Router();
const { Visit, Patient, EventLog } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Get all visits
router.get('/', async (req, res) => {
  try {
    const { status, patient_id, date } = req.query;
    let query = {};

    if (status) query.current_step = status;
    if (patient_id) query.patient_id = patient_id;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.created_at = { $gte: startDate, $lt: endDate };
    }

    const visits = await Visit.find(query).sort({ created_at: -1 });

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

// Get visit by ID
router.get('/:id', async (req, res) => {
  try {
    const visit = await Visit.findOne({ visit_id: req.params.id });

    if (!visit) {
      return res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
    }

    res.json({
      success: true,
      data: visit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new visit
router.post('/', async (req, res) => {
  try {
    const { patient_id, visit_type } = req.body;

    // Validate required fields
    if (!patient_id) {
      return res.status(400).json({
        success: false,
        error: 'Patient ID is required'
      });
    }

    // Check if patient exists
    const patient = await Patient.findOne({ patient_id });
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    // Generate visit ID and token
    const visitCount = await Visit.countDocuments();
    const visit_id = `VIS${String(visitCount + 1).padStart(6, '0')}`;
    const token = `TKN${Date.now()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    // Create new visit
    const visit = await Visit.create({
      visit_id,
      patient_id,
      token,
      visit_type: visit_type || 'OPD',
      current_step: 'registration'
    });

    // Create event log
    await EventLog.create({
      event_id: `EVT${uuidv4()}`,
      visit_id,
      event_type: 'visit_created',
      payload: { patient_id, visit_type, token }
    });

    res.status(201).json({
      success: true,
      data: visit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update visit status
router.put('/:id/status', async (req, res) => {
  try {
    const { current_step } = req.body;

    if (!current_step) {
      return res.status(400).json({
        success: false,
        error: 'Current step is required'
      });
    }

    const visit = await Visit.findOneAndUpdate(
      { visit_id: req.params.id },
      { current_step },
      { new: true }
    );

    if (!visit) {
      return res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
    }

    res.json({
      success: true,
      data: visit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mark visit as billed
router.put('/:id/bill', async (req, res) => {
  try {
    const visit = await Visit.findOneAndUpdate(
      { visit_id: req.params.id },
      { billed: true },
      { new: true }
    );

    if (!visit) {
      return res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
    }

    res.json({
      success: true,
      data: visit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get visit timeline (event logs)
router.get('/:id/timeline', async (req, res) => {
  try {
    const events = await EventLog.find({ visit_id: req.params.id })
      .sort({ created_at: 1 });

    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get today's visits
router.get('/today/all', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const visits = await Visit.find({
      created_at: { $gte: today, $lt: tomorrow }
    }).sort({ created_at: -1 });

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

module.exports = router;

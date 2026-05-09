const express = require('express');
const router = express.Router();
const RateLimit = require('../models/RateLimit');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/rate-limits — Admin: all rules; User: active rule
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const rules = await RateLimit.find().sort({ createdAt: -1 }).populate('createdBy', 'username');
      return res.json({ rules });
    }
    // Regular user just gets the active rule
    const rule = await RateLimit.findOne({ isActive: true });
    res.json({ rule });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/rate-limits — Admin: create rule
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, maxRequests, windowMinutes, description } = req.body;

    if (!name || !maxRequests || !windowMinutes) {
      return res.status(400).json({ message: 'name, maxRequests, and windowMinutes are required' });
    }

    const rule = await RateLimit.create({
      name,
      maxRequests: Number(maxRequests),
      windowMinutes: Number(windowMinutes),
      description,
      createdBy: req.user._id,
    });

    res.status(201).json({ message: 'Rate limit rule created', rule });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Rule name already exists' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/rate-limits/:id — Admin: update rule
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, maxRequests, windowMinutes, description, isActive } = req.body;

    const rule = await RateLimit.findByIdAndUpdate(
      req.params.id,
      { name, maxRequests, windowMinutes, description, isActive },
      { new: true, runValidators: true }
    );

    if (!rule) return res.status(404).json({ message: 'Rule not found' });

    res.json({ message: 'Rule updated', rule });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/rate-limits/:id — Admin: delete rule
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const rule = await RateLimit.findByIdAndDelete(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Rule not found' });
    res.json({ message: 'Rule deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

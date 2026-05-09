const express = require('express');
const router = express.Router();
const ApiUsage = require('../models/ApiUsage');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/usage/me — User's own stats
router.get('/me', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [logs, total, blocked, allowed] = await Promise.all([
      ApiUsage.find({ user: req.user._id })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('rateLimitRule', 'name maxRequests windowMinutes'),
      ApiUsage.countDocuments({ user: req.user._id }),
      ApiUsage.countDocuments({ user: req.user._id, blocked: true }),
      ApiUsage.countDocuments({ user: req.user._id, blocked: false }),
    ]);

    res.json({ logs, total, blocked, allowed, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/usage/all — Admin: all users' stats
router.get('/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (page - 1) * limit;

    const [logs, total, blocked, allowed] = await Promise.all([
      ApiUsage.find()
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('user', 'username email role')
        .populate('rateLimitRule', 'name maxRequests windowMinutes'),
      ApiUsage.countDocuments(),
      ApiUsage.countDocuments({ blocked: true }),
      ApiUsage.countDocuments({ blocked: false }),
    ]);

    res.json({ logs, total, blocked, allowed, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/usage/summary — Admin: per-user summary
router.get('/summary', authenticate, requireAdmin, async (req, res) => {
  try {
    const summary = await ApiUsage.aggregate([
      {
        $group: {
          _id: '$user',
          totalRequests: { $sum: 1 },
          blockedRequests: { $sum: { $cond: ['$blocked', 1, 0] } },
          allowedRequests: { $sum: { $cond: ['$blocked', 0, 1] } },
          lastRequest: { $max: '$timestamp' },
        },
      },
      { $sort: { totalRequests: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          totalRequests: 1,
          blockedRequests: 1,
          allowedRequests: 1,
          lastRequest: 1,
          'user.username': 1,
          'user.email': 1,
          'user.role': 1,
        },
      },
    ]);

    res.json({ summary });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

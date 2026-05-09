const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const rateLimitMiddleware = require('../middleware/rateLimit');
const ApiUsage = require('../models/ApiUsage');

// Apply auth + rate limit to all routes here
router.use(authenticate, rateLimitMiddleware);

// Helper to log successful requests
const logRequest = async (req, statusCode = 200) => {
  await ApiUsage.create({
    user: req.user._id,
    endpoint: req.originalUrl,
    method: req.method,
    statusCode,
    blocked: false,
    rateLimitRule: req.rateLimitRule?._id || null,
  });
};

// GET /api/protected/data — Sample protected endpoint
router.get('/data', async (req, res) => {
  await logRequest(req);
  res.json({
    message: 'Protected data accessed successfully',
    data: {
      timestamp: new Date(),
      user: req.user.username,
      requestsUsed: (req.requestCount || 0) + 1,
      limit: req.rateLimitRule?.maxRequests,
      windowMinutes: req.rateLimitRule?.windowMinutes,
    },
  });
});

// GET /api/protected/resource — Another sample endpoint
router.get('/resource', async (req, res) => {
  await logRequest(req);
  res.json({
    message: 'Resource fetched successfully',
    resource: {
      id: Math.floor(Math.random() * 1000),
      name: 'Sample Resource',
      createdAt: new Date(),
    },
  });
});

// POST /api/protected/action — Sample POST endpoint
router.post('/action', async (req, res) => {
  await logRequest(req);
  res.json({
    message: 'Action performed successfully',
    result: { success: true, payload: req.body },
  });
});

module.exports = router;

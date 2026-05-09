const RateLimit = require('../models/RateLimit');
const ApiUsage = require('../models/ApiUsage');

const rateLimitMiddleware = async (req, res, next) => {
  try {
    // Fetch the active rate limit rule from DB
    const rule = await RateLimit.findOne({ isActive: true }).sort({ createdAt: -1 });

    if (!rule) {
      // No rule defined – allow request but still track it
      return next();
    }

    const windowStart = new Date(Date.now() - rule.windowMinutes * 60 * 1000);

    // Count requests by this user within the window (not blocked)
    const requestCount = await ApiUsage.countDocuments({
      user: req.user._id,
      timestamp: { $gte: windowStart },
      blocked: false,
    });

    if (requestCount >= rule.maxRequests) {
      // Log the blocked request
      await ApiUsage.create({
        user: req.user._id,
        endpoint: req.originalUrl,
        method: req.method,
        statusCode: 429,
        blocked: true,
        rateLimitRule: rule._id,
      });

      const resetAt = new Date(windowStart.getTime() + rule.windowMinutes * 60 * 1000);

      return res.status(429).json({
        message: 'Rate limit exceeded',
        limit: rule.maxRequests,
        windowMinutes: rule.windowMinutes,
        requestsUsed: requestCount,
        resetAt,
      });
    }

    // Attach rule info for the controller to log on success
    req.rateLimitRule = rule;
    req.requestCount = requestCount;
    next();
  } catch (err) {
    console.error('Rate limit middleware error:', err);
    next(); // fail open — don't block if middleware errors
  }
};

module.exports = rateLimitMiddleware;

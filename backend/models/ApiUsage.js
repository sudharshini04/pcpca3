const mongoose = require('mongoose');

const apiUsageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    endpoint: { type: String, required: true },
    method: { type: String, required: true },
    statusCode: { type: Number, default: 200 },
    blocked: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
    rateLimitRule: { type: mongoose.Schema.Types.ObjectId, ref: 'RateLimit' },
  },
  { timestamps: false }
);

// Index for fast lookups: user + time range
apiUsageSchema.index({ user: 1, timestamp: -1 });
apiUsageSchema.index({ user: 1, endpoint: 1, timestamp: -1 });

module.exports = mongoose.model('ApiUsage', apiUsageSchema);

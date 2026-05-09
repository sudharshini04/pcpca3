const mongoose = require('mongoose');

const rateLimitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    maxRequests: { type: Number, required: true },   // X requests
    windowMinutes: { type: Number, required: true }, // per Y minutes
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RateLimit', rateLimitSchema);

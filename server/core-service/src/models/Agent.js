const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  capacity: { type: Number, default: 10 },
  currentLoad: { type: Number, default: 0 },
  shiftStatus: { type: String, enum: ['offline', 'active', 'on_break'], default: 'offline' }
}, { timestamps: true });

// 2dsphere index for agent proximity queries
agentSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('Agent', agentSchema);

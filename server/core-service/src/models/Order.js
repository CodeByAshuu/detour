const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  pickupPoint: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  dropPoint: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  timeWindow: {
    start: { type: Date },
    end: { type: Date }
  },
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  status: { type: String, enum: ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'FAILED'], default: 'PENDING' },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  // SLA tracking timestamps
  assignedAt:  { type: Date },   // when the order was handed to an agent
  deliveredAt: { type: Date },   // when the order reached terminal state (DELIVERED or FAILED)
}, { timestamps: true });

// 2dsphere index for geospatial proximity queries
orderSchema.index({ pickupPoint: '2dsphere' });
orderSchema.index({ dropPoint: '2dsphere' });

module.exports = mongoose.model('Order', orderSchema);

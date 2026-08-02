const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  center: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  radiusKm: { type: Number, required: true }
}, { timestamps: true });

zoneSchema.index({ center: '2dsphere' });

module.exports = mongoose.model('Zone', zoneSchema);

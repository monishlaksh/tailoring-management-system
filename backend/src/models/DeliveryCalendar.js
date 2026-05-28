const mongoose = require('mongoose')

const deliveryCalendarSchema = new mongoose.Schema({
  date:       { type: String, required: true },
  clothType:  { type: String, required: true },
  pieceCount: { type: Number, default: 0 },
}, { timestamps: true })

deliveryCalendarSchema.index({ date: 1, clothType: 1 }, { unique: true })

module.exports = mongoose.model('DeliveryCalendar', deliveryCalendarSchema)
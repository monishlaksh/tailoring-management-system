const mongoose = require('mongoose')
const Counter  = require('./Counter')

const orderSchema = new mongoose.Schema({
  orderID: { type: String, unique: true },
  customerID: { type: String, required: true },
  customerRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  clothType: {
    type: String, required: true,
    enum: ['Blouse','Chudi','Saree Blouse','Shirt','Pant','Lehenga','Kids Dress','Custom Dress'],
  },
  quantity:            { type: Number, default: 1 },
  fabricNotes:         { type: String, default: '' },
  specialInstructions: { type: String, default: '' },
  measurements: {
    shoulder: { type: String, default: '' },
    chest:    { type: String, default: '' },
    waist:    { type: String, default: '' },
    hip:      { type: String, default: '' },
    sleeve:   { type: String, default: '' },
    length:   { type: String, default: '' },
    neck:     { type: String, default: '' },
    custom:   { type: String, default: '' },
  },
  alteration: {
    required: { type: Boolean, default: false },
    notes:    { type: String, default: '' },
  },
  status: {
    type: String,
    enum: ['Booking','Cutting','Stitching','Finishing','Ready For Delivery'],
    default: 'Booking',
  },
  bookingDate:    { type: Date, default: Date.now },
  deliveryDate:   { type: Date, required: true },
  referenceImage: { type: String, default: '' },
  isDelayed:      { type: Boolean, default: false },
}, { timestamps: true })

orderSchema.pre('save', async function (next) {
  if (this.orderID) return next()
  try {
    const counter = await Counter.findByIdAndUpdate(
      'orderID',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    )
    this.orderID = `ORD${String(counter.seq).padStart(6, '0')}`
    return next()
  } catch (err) {
    return next(err)
  }
})

module.exports = mongoose.model('Order', orderSchema)
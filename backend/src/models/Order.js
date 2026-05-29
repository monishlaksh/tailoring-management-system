const mongoose = require('mongoose')

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

// ── Robust ID generation — finds the highest existing ID ──
orderSchema.pre('save', async function (next) {
  if (!this.orderID) {
    try {
      // Find the order with the highest orderID number
      const last = await mongoose.model('Order')
        .findOne({}, { orderID: 1 })
        .sort({ orderID: -1 })
        .lean()

      let nextNumber = 1
      if (last && last.orderID) {
        const num = parseInt(last.orderID.replace('ORD', ''), 10)
        if (!isNaN(num)) nextNumber = num + 1
      }

      // Keep trying until we find a unique ID
      let orderID = `ORD${String(nextNumber).padStart(6, '0')}`
      let exists  = await mongoose.model('Order').findOne({ orderID }).lean()

      while (exists) {
        nextNumber++
        orderID = `ORD${String(nextNumber).padStart(6, '0')}`
        exists  = await mongoose.model('Order').findOne({ orderID }).lean()
      }

      this.orderID = orderID
    } catch (error) {
      // Fallback: timestamp-based ID
      this.orderID = `ORD${Date.now()}`
    }
  }
  next()
})

module.exports = mongoose.model('Order', orderSchema)
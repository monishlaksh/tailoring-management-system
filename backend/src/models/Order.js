const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
  orderID:             { type: String, unique: true, required: true },
  customerID:          { type: String, required: true },
  customerRef:         { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  clothType: {
    type: String, required: true,
    enum: ['Blouse','Chudi','Saree Blouse','Shirt','Pant','Lehenga','Kids Dress','Custom Dress'],
  },
  quantity:            { type: Number, default: 1 },
  unitCost:            { type: Number, default: 0 },
  amountSettled:       { type: Number, default: 0 },
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
  createdBy: {
    role:       { type: String, enum: ['admin','employee'], default: 'admin' },
    employeeID: { type: String, default: '' },
    name:       { type: String, default: 'Admin' },
  },
}, { timestamps: true })

module.exports = mongoose.model('Order', orderSchema)
const mongoose = require('mongoose')

const stageSchema = new mongoose.Schema({
  employeeID:    { type: String, default: '' },
  employeeName:  { type: String, default: '' },
  status:        { type: String, enum: ['not_assigned','pending','completed'], default: 'not_assigned' },
  assignedAt:    { type: Date },
  completedAt:   { type: Date },
  adminApproved: { type: Boolean, default: false },
  approvedAt:    { type: Date },
  award:         { type: Number, default: 0 }, // admin only — amount awarded to employee
  notes:         { type: String, default: '' },
}, { _id: false })

const allotmentSchema = new mongoose.Schema({
  orderID:    { type: String, required: true, unique: true },
  customerID: { type: String, required: true },
  cutting:    { type: stageSchema, default: () => ({}) },
  stitching:  { type: stageSchema, default: () => ({}) },
  finishing:  { type: stageSchema, default: () => ({}) },
  qrCode:     { type: String, default: '' }, // base64 QR data URL
}, { timestamps: true })

module.exports = mongoose.model('Allotment', allotmentSchema)
const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema({
  customerID: { type: String, unique: true, required: true },
  name:       { type: String, required: true, trim: true },
  phone:      { type: String, required: true, trim: true },
  address:    { type: String, default: '' },
  notes:      { type: String, default: '' },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('Customer', customerSchema)
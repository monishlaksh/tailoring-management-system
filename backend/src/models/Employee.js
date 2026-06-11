const mongoose = require('mongoose')

const employeeSchema = new mongoose.Schema({
  employeeID: { type: String, unique: true, required: true },
  name:       { type: String, required: true, trim: true },
  username:   { type: String, required: true, unique: true, trim: true },
  password:   { type: String, required: true },
  role:       {
    type:    String,
    enum:    ['cutting', 'stitching', 'finishing', 'all'],
    default: 'all',
  },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('Employee', employeeSchema)
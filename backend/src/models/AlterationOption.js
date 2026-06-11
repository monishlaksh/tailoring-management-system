const mongoose = require('mongoose')

const alterationOptionSchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  extraCost:   { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('AlterationOption', alterationOptionSchema)
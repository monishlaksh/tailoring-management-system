const mongoose = require('mongoose')

const subtypeSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  cost:     { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { _id: true })

const clothTypeSchema = new mongoose.Schema({
  name:     { type: String, required: true, unique: true, trim: true },
  subtypes: [subtypeSchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.model('ClothType', clothTypeSchema)
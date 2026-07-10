const mongoose = require('mongoose')

// Measurement field definition
const subtypeSchema = new mongoose.Schema({
  name:     { type:String, required:true, trim:true },
  nameTa:   { type:String, default:'' },
  cost:     { type:Number, default:0 },
  image:    { type:String, default:'' }, // ← Cloudinary URL
  isActive: { type:Boolean, default:true },
}, { _id:true })

const measurementFieldSchema = new mongoose.Schema({
  key:      { type:String, required:true },
  label:    { type:String, required:true },
  labelTa:  { type:String, default:'' },
  required: { type:Boolean, default:false },
  image:    { type:String, default:'' }, // ← guide image for this measurement
}, { _id:false })

const typeSchema = new mongoose.Schema({
  name:        { type:String, required:true, trim:true },
  nameTa:      { type:String, default:'' },
  cost:        { type:Number, default:0 },  // type-level cost
  empCost:     { type:Number, default:0 },  // employee rate for this type
  subtypes:    [subtypeSchema],
  isActive:    { type:Boolean, default:true },
}, { _id:true })

const clothTypeSchema = new mongoose.Schema({
  name:         { type:String, required:true, unique:true, trim:true },
  nameTa:       { type:String, default:'' },
  // Cloth-specific measurement fields
  measurements: [measurementFieldSchema],
  types:        [typeSchema],
  isActive:     { type:Boolean, default:true },
}, { timestamps:true })

module.exports = mongoose.model('ClothType', clothTypeSchema)
const mongoose = require('mongoose')

const subtypeSchema = new mongoose.Schema({
  name:     { type:String, required:true, trim:true },
  nameTa:   { type:String, default:'' },
  cost:     { type:Number, default:0 },   // customer price
  empCost:  { type:Number, default:0 },   // ← employee rate
  image:    { type:String, default:'' },
  isActive: { type:Boolean, default:true },
}, { _id:true })

const typeSchema = new mongoose.Schema({
  name:     { type:String, required:true, trim:true },
  nameTa:   { type:String, default:'' },
  cost:     { type:Number, default:0 },
  empCost:  { type:Number, default:0 },
  image:    { type:String, default:'' }, // ← image here on TYPE
  subtypes: [subtypeSchema],
  isActive: { type:Boolean, default:true },
}, { _id:true })

const measurementFieldSchema = new mongoose.Schema({
  key:      { type:String, required:true },
  label:    { type:String, required:true },
  labelTa:  { type:String, default:'' },
  required: { type:Boolean, default:false },
  image:    { type:String, default:'' }, // ← guide image for this measurement
}, { _id:false })


const clothTypeSchema = new mongoose.Schema({
  name:         { type:String, required:true, unique:true, trim:true },
  nameTa:       { type:String, default:'' },
  // Cloth-specific measurement fields
  measurements: [measurementFieldSchema],
  types:        [typeSchema],
  isActive:     { type:Boolean, default:true },
}, { timestamps:true })

module.exports = mongoose.model('ClothType', clothTypeSchema)
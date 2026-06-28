const mongoose = require('mongoose')

// Measurement field definition
const measurementFieldSchema = new mongoose.Schema({
  key:      { type:String, required:true }, // e.g. 'chest', 'hip'
  label:    { type:String, required:true }, // e.g. 'Chest', 'Hip'
  labelTa:  { type:String, default:'' },   // Tamil label
  required: { type:Boolean, default:false },
}, { _id:false })

const subtypeSchema = new mongoose.Schema({
  name:    { type:String, required:true, trim:true },
  nameTa:  { type:String, default:'' },
  cost:    { type:Number, default:0 },
  isActive:{ type:Boolean, default:true },
}, { _id:true })

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
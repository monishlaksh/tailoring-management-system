const mongoose = require('mongoose')

const alterationOptionSchema = new mongoose.Schema({
  name:        { type:String, required:true, trim:true },
  description: { type:String, default:'' },
  clothType:   { type:String, default:'all' },
  extraCost:   { type:Number, default:0 },  // customer extra price
  empCost:     { type:Number, default:0 },  // ← employee rate for this alteration
  isActive:    { type:Boolean, default:true },
}, { timestamps:true })

module.exports = mongoose.model('AlterationOption', alterationOptionSchema)
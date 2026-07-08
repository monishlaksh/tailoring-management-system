const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema({
  customerID:    { type:String, unique:true, required:true },
  name:          { type:String, required:true, trim:true },
  phone:         { type:String, required:true, trim:true },
  address:       { type:String, default:'' },
  notes:         { type:String, default:'' },
  amountSettled: { type:Number, default:0 },
  isActive:      { type:Boolean, default:true },

  // Saved measurements — updated every time an order is saved
  measurements: {
    type:    Map,
    of:      String,
    default: {},
  },
  // Track when measurements were last updated
  measurementsUpdatedAt: { type:Date, default:null },
}, { timestamps:true })

module.exports = mongoose.model('Customer', customerSchema)
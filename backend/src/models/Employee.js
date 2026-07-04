const mongoose = require('mongoose')

const employeeSchema = new mongoose.Schema({
  employeeID:    { type:String, unique:true, required:true },
  name:          { type:String, required:true, trim:true },
  username:      { type:String, required:true, unique:true, trim:true },
  password:      { type:String, required:true },
  plainPassword: { type:String, default:'' }, // stored for admin reference only
  role:          { type:String, enum:['cutting','stitching','finishing','all'], default:'all' },
  hasFullAccess: { type:Boolean, default:false }, // admin grants this
  isActive:      { type:Boolean, default:true },
  bonus: { type:Number, default:0 }, // fixed bonus per order on top of emp rate
}, { timestamps:true })

module.exports = mongoose.model('Employee', employeeSchema)
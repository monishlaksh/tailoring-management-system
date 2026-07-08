const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const employeeSchema = new mongoose.Schema({
  employeeID:    { type:String, unique:true, required:true },
  name:          { type:String, required:true, trim:true },
  username:      { type:String, required:true, unique:true, trim:true },
  password:      { type:String, required:true },
  plainPassword: { type:String, default:'' },

  // Work role — for allotment stage assignment
  role: {
    type:    String,
    enum:    ['cutting','stitching','finishing','all'],
    default: 'all',
  },

  // Access role — determines what they can see/do
  accessRole: {
    type:    String,
    enum:    ['employee','receptionist','manager'],
    default: 'employee',
  },

  hasFullAccess: { type:Boolean, default:false }, // legacy — manager sets this true
  bonus:         { type:Number, default:0 },
  isActive:      { type:Boolean, default:true },
}, { timestamps:true })

module.exports = mongoose.model('Employee', employeeSchema)
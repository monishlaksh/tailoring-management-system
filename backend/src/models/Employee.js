const mongoose = require('mongoose')

const employeeSchema = new mongoose.Schema({
  employeeID:    { type:String, unique:true },
  name:          { type:String, required:true, trim:true },
  username:      { type:String, required:true, unique:true, trim:true },
  password:      { type:String, required:true },
  plainPassword: { type:String, default:'' },  // ← must exist
  phone:         { type:String, default:'' },
  role:          {
    type:    String,
    enum:    ['cutting','stitching','finishing','all'],
    default: 'all',
  },
  accessRole:    {
    type:    String,
    enum:    ['employee','receptionist','manager'],
    default: 'employee',
  },
  bonus:         { type:Number, default:0 },
  hasFullAccess: { type:Boolean, default:false },
  isActive:      { type:Boolean, default:true },
}, { timestamps:true })

// Auto-generate employeeID
employeeSchema.pre('save', async function (next) {
  if (this.isNew && !this.employeeID) {
    try {
      const Counter = require('./Counter')
      const counter = await Counter.findOneAndUpdate(
        { _id: 'employeeID' },   // ← use _id not name
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      )
      this.employeeID = `EMP${String(counter.seq).padStart(6, '0')}`
    } catch (e) {
      // Fallback
      this.employeeID = `EMP${Date.now().toString().slice(-6)}`
    }
  }
  next()
})
module.exports = mongoose.model('Employee', employeeSchema)
const mongoose = require('mongoose')
const Counter  = require('./Counter')

const customerSchema = new mongoose.Schema({
  customerID: { type: String, unique: true },
  name:       { type: String, required: true, trim: true },
  phone:      { type: String, required: true, trim: true },
  address:    { type: String, default: '' },
  notes:      { type: String, default: '' },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true })

customerSchema.pre('save', async function (next) {
  if (this.customerID) return next()
  try {
    const counter = await Counter.findByIdAndUpdate(
      'customerID',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    )
    this.customerID = `CUST${String(counter.seq).padStart(6, '0')}`
    return next()
  } catch (err) {
    return next(err)
  }
})

module.exports = mongoose.model('Customer', customerSchema)
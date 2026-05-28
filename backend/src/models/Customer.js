const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema({
  customerID: { type: String, unique: true },
  name:       { type: String, required: true, trim: true },
  phone:      { type: String, required: true, trim: true },
  address:    { type: String, default: '' },
  notes:      { type: String, default: '' },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true })

customerSchema.pre('save', async function () {
  if (!this.customerID) {
    const count = await mongoose.model('Customer').countDocuments()
    this.customerID = `CUST${String(count + 1).padStart(6, '0')}`
  }
  
})

module.exports = mongoose.model('Customer', customerSchema)
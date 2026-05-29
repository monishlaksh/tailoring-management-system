const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema({
  customerID: { type: String, unique: true },
  name:       { type: String, required: true, trim: true },
  phone:      { type: String, required: true, trim: true },
  address:    { type: String, default: '' },
  notes:      { type: String, default: '' },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true })

// ── Robust ID generation ──
customerSchema.pre('save', async function (next) {
  if (!this.customerID) {
    try {
      const last = await mongoose.model('Customer')
        .findOne({}, { customerID: 1 })
        .sort({ customerID: -1 })
        .lean()

      let nextNumber = 1
      if (last && last.customerID) {
        const num = parseInt(last.customerID.replace('CUST', ''), 10)
        if (!isNaN(num)) nextNumber = num + 1
      }

      let customerID = `CUST${String(nextNumber).padStart(6, '0')}`
      let exists     = await mongoose.model('Customer').findOne({ customerID }).lean()

      while (exists) {
        nextNumber++
        customerID = `CUST${String(nextNumber).padStart(6, '0')}`
        exists     = await mongoose.model('Customer').findOne({ customerID }).lean()
      }

      this.customerID = customerID
    } catch (error) {
      this.customerID = `CUST${Date.now()}`
    }
  }
  next()
})

module.exports = mongoose.model('Customer', customerSchema)
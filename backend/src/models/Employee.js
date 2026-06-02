const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const employeeSchema = new mongoose.Schema({
  employeeID: { type: String, unique: true },
  name:       { type: String, required: true, trim: true },
  username:   { type: String, required: true, unique: true, trim: true },
  password:   { type: String, required: true },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true })

employeeSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

employeeSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password)
}

module.exports = mongoose.model('Employee', employeeSchema)
const mongoose = require('mongoose')

const expenseSchema = new mongoose.Schema({
  expenseID:   { type:String, unique:true, required:true },
  title:       { type:String, required:true, trim:true },
  category:    {
    type: String,
    enum: ['Rent','Electricity','Materials','Equipment','Salary','Maintenance','Transport','Food','Other'],
    default: 'Other',
  },
  amount:      { type:Number, required:true, min:0 },
  date:        { type:Date, required:true, default:Date.now },
  notes:       { type:String, default:'' },
  paidBy:      { type:String, default:'Admin' },
  isRecurring: { type:Boolean, default:false },
}, { timestamps:true })

module.exports = mongoose.model('Expense', expenseSchema)
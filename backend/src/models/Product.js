const mongoose = require('mongoose')

const stockHistorySchema = new mongoose.Schema({
  type:      { type:String, enum:['purchase','sale','adjustment'], required:true },
  quantity:  { type:Number, required:true }, // positive for purchase/adjustment-add, negative for sale
  note:      { type:String, default:'' },
  date:      { type:Date, default:Date.now },
}, { _id:true })

const productSchema = new mongoose.Schema({
  productID:     { type:String, unique:true, required:true },
  name:          { type:String, required:true, trim:true },
  nameTa:        { type:String, default:'' },
  category:      { type:String, default:'' }, // e.g. Fabric, Thread, Button, Zipper
  unit:          { type:String, default:'pcs' }, // pcs, meters, kg, rolls
  purchasePrice: { type:Number, default:0, required:true }, // cost to buy
  customerPrice: { type:Number, default:0, required:true }, // price sold to customer
  stock:         { type:Number, default:0 }, // current available stock
  lowStockAlert: { type:Number, default:5 }, // alert threshold
  notes:         { type:String, default:'' },
  history:       [stockHistorySchema],
  isActive:      { type:Boolean, default:true },
}, { timestamps:true })

// Virtual for revenue per unit
productSchema.virtual('revenuePerUnit').get(function () {
  return this.customerPrice - this.purchasePrice
})

productSchema.set('toJSON', { virtuals:true })
productSchema.set('toObject', { virtuals:true })

module.exports = mongoose.model('Product', productSchema)
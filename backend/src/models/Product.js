const mongoose = require('mongoose')

const stockHistorySchema = new mongoose.Schema({
  type:        { type:String, enum:['purchase','sale','adjustment'], required:true },
  quantity:    { type:Number, required:true }, // positive for purchase, negative for sale
  unitPrice:   { type:Number, default:0 },     // price per unit at time of sale
  revenue:     { type:Number, default:0 },     // revenue earned on this sale
  note:        { type:String, default:'' },
  customerName:{ type:String, default:'' },
  date:        { type:Date, default:Date.now },
}, { _id:true })

const productSchema = new mongoose.Schema({
  productID:     { type:String, unique:true, required:true },
  name:          { type:String, required:true, trim:true },
  nameTa:        { type:String, default:'' },
  category:      { type:String, default:'' },
  unit:          { type:String, default:'pcs' },
  purchasePrice: { type:Number, default:0, required:true },
  customerPrice: { type:Number, default:0, required:true },
  stock:         { type:Number, default:0 },
  lowStockAlert: { type:Number, default:5 },
  totalSold:     { type:Number, default:0 }, // cumulative units sold
  totalRevenue:  { type:Number, default:0 }, // cumulative revenue earned
  notes:         { type:String, default:'' },
  history:       [stockHistorySchema],
  isActive:      { type:Boolean, default:true },
}, { timestamps:true })

productSchema.virtual('revenuePerUnit').get(function () {
  return this.customerPrice - this.purchasePrice
})

productSchema.set('toJSON', { virtuals:true })
productSchema.set('toObject', { virtuals:true })

module.exports = mongoose.model('Product', productSchema)
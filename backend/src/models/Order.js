const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
  orderID:    { type:String, unique:true, required:true },
  customerID: { type:String, required:true },
  customerRef:{ type:mongoose.Schema.Types.ObjectId, ref:'Customer' },
  clothType:  { type:String, required:true },
  quantity:   { type:Number, default:1 },
  unitCost:   { type:Number, default:0 },
  amountSettled: { type:Number, default:0 },
  fabricNotes:   { type:String, default:'' },
  specialInstructions: { type:String, default:'' },
  // Add to orderSchema:
  empRate: { type:Number, default:0 }, // total emp rate = type + subtype + alterations

  // Flexible measurements — any key/value pair
  measurements: {
    type:    Map,
    of:      String,
    default: {},
  },

  alteration: {
    required:        { type:Boolean, default:false },
    selectedOptions: [String],
    notes:           { type:String, default:'' },
    extraCost:       { type:Number, default:0 },
  },

  deliveryDate: { type:Date },
  status: {
    type:    String,
    enum:    ['Booking','Cutting','Stitching','Finishing','Ready For Delivery','Delivered'],
    default: 'Booking',
  },

  voiceNote: {
    data:     { type:String, default:'' },
    mimeType: { type:String, default:'audio/webm' },
    duration: { type:Number, default:0 },
  },
  payment: {
  method:        { type:String, enum:['cash','gpay','mixed','unpaid'], default:'unpaid' },
  amountPaid:    { type:Number, default:0 },
  amountDue:     { type:Number, default:0 },
  paidAt:        { type:Date },
  gpayRef:       { type:String, default:'' },
  notes:         { type:String, default:'' },
  cashBreakdown: {
    coins: { type:Number, default:0 },
    ten:   { type:Number, default:0 },
    twenty:{ type:Number, default:0 },
    fifty: { type:Number, default:0 },
    hundred:{ type:Number, default:0 },
    twoHundred:{ type:Number, default:0 },
    fiveHundred:{ type:Number, default:0 },
  },
  history: [{
    method:    String,
    amount:    Number,
    paidAt:    { type:Date, default:Date.now },
    notes:     String,
    cashBreakdown: {
      coins:      Number,
      ten:        Number,
      twenty:     Number,
      fifty:      Number,
      hundred:    Number,
      twoHundred: Number,
      fiveHundred:Number,
    },
  }],
},

  createdBy: {
    role:       { type:String, default:'admin' },
    employeeID: { type:String, default:'' },
    name:       { type:String, default:'Admin' },
  },
}, { timestamps:true })

module.exports = mongoose.model('Order', orderSchema)
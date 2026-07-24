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

  createdBy: {
    role:       { type:String, default:'admin' },
    employeeID: { type:String, default:'' },
    name:       { type:String, default:'Admin' },
  },
}, { timestamps:true })

module.exports = mongoose.model('Order', orderSchema)
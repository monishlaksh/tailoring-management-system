const mongoose = require('mongoose')

const stageSchema = new mongoose.Schema({
  employeeID:    { type:String, default:'' },
  employeeName:  { type:String, default:'' },
  status:        {
    type:    String,
    enum:    ['not_assigned','pending','completed'],
    default: 'not_assigned',
  },
  assignedAt:    { type:Date, default:null },
  completedAt:   { type:Date, default:null },
  approvedAt:    { type:Date, default:null },
  adminApproved: { type:Boolean, default:false },
  award:         { type:Number, default:0 },
  notes:         { type:String, default:'' },
}, { _id:false })

const deliverySchema = new mongoose.Schema({
  status:         {
    type:    String,
    enum:    ['pending','delivered'],
    default: 'pending',
  },
  deliveredAt:    { type:Date, default:null },
  acknowledgedBy: { type:String, default:'' },
  notes:          { type:String, default:'' },
}, { _id:false })

const allotmentSchema = new mongoose.Schema({
  orderID:    { type:String, required:true, unique:true },
  customerID: { type:String, default:'' },
  qrCode:     { type:String, default:'' },
  cutting:    { type:stageSchema,   default:() => ({}) },
  stitching:  { type:stageSchema,   default:() => ({}) },
  finishing:  { type:stageSchema,   default:() => ({}) },
  delivery:   { type:deliverySchema, default:() => ({}) },
}, { timestamps:true })

allotmentSchema.index({ orderID: 1 })

allotmentSchema.index({
  'cutting.employeeID': 1,
  'cutting.status': 1,
  'cutting.completedAt': 1
})

allotmentSchema.index({
  'stitching.employeeID': 1,
  'stitching.status': 1,
  'stitching.completedAt': 1
})

allotmentSchema.index({
  'finishing.employeeID': 1,
  'finishing.status': 1,
  'finishing.completedAt': 1
})

module.exports = mongoose.model('Allotment', allotmentSchema)
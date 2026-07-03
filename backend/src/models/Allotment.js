const mongoose = require('mongoose')

const stageSchema = new mongoose.Schema({
  employeeID:    { type:String, default:'' },
  employeeName:  { type:String, default:'' },
  status:        { type:String, enum:['not_assigned','pending','completed'], default:'not_assigned' },
  assignedAt:    { type:Date },
  completedAt:   { type:Date },
  approvedAt:    { type:Date },
  adminApproved: { type:Boolean, default:false },
  award:         { type:Number, default:0 },
  notes:         { type:String, default:'' },
}, { _id:false })

const deliverySchema = new mongoose.Schema({
  status:          { type:String, enum:['pending','delivered'], default:'pending' },
  deliveredAt:     { type:Date },
  acknowledgedBy:  { type:String, default:'' }, // admin who marked delivered
  customerSign:    { type:String, default:'' }, // optional signature/note
  notes:           { type:String, default:'' },
}, { _id:false })

const allotmentSchema = new mongoose.Schema({
  orderID:   { type:String, required:true, unique:true },
  customerID:{ type:String, default:'' },
  qrCode:    { type:String, default:'' },
  cutting:   { type:stageSchema, default:() => ({}) },
  stitching: { type:stageSchema, default:() => ({}) },
  finishing: { type:stageSchema, default:() => ({}) },
  delivery:  { type:deliverySchema, default:() => ({}) },
}, { timestamps:true })

module.exports = mongoose.model('Allotment', allotmentSchema)
const express    = require('express')
const Allotment  = require('../models/Allotment')
const Order      = require('../models/Order')
const Employee   = require('../models/Employee')
const { protect } = require('../middleware/auth')
const QRCode     = require('qrcode')
const router     = express.Router()

const generateQR = async (orderID) => {
  try {
    const url = `${process.env.FRONTEND_URL || 'https://tailoring-management-system.vercel.app'}/admin/allotment/${orderID}`
    const qr  = await QRCode.toDataURL(url, {
      width:  300,
      margin: 2,
      color:  { dark:'#1E1B4B', light:'#FFFFFF' },
    })
    return qr
  } catch (e) {
    console.error('QR generation error:', e.message)
    return ''
  }
}

// ── GET all allotments ───────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const allotments = await Allotment.find().sort({ createdAt:-1 }).lean()
    res.json({ success:true, allotments })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// ── GET by QR scan — MUST be before /:orderID ───────────────
// No auth — public route for employee phone scan
// ── GET by QR scan — public route ───────────────────────────
router.get('/scan/:orderID', async (req, res) => {
  try {
    const { orderID } = req.params
    const { stage }   = req.query

    // Clean orderID — remove any trailing slashes or spaces
    const cleanOrderID = orderID.trim().toUpperCase()

    console.log(`QR Scan: orderID=${cleanOrderID}, stage=${stage}`)

    const order = await Order.findOne({ orderID: cleanOrderID }).lean()
    if (!order) {
      console.log(`Order not found: ${cleanOrderID}`)
      // Try case-insensitive search as fallback
      const orderFallback = await Order.findOne({
        orderID: { $regex: new RegExp(`^${cleanOrderID}$`, 'i') }
      }).lean()
      if (!orderFallback)
        return res.status(404).json({
          success: false,
          message: `Order ${cleanOrderID} not found`,
        })
      return handleScanResponse(res, orderFallback, stage)
    }

    return handleScanResponse(res, order, stage)
  } catch (e) {
    console.error('Scan error:', e.message)
    res.status(500).json({ success:false, message:e.message })
  }
})

// Helper function for scan response
async function handleScanResponse(res, order, stage) {
  const allotment = await Allotment.findOne({
    orderID: order.orderID
  }).lean()

  const response = {
    success:      true,
    orderID:      order.orderID,
    clothType:    order.clothType,
    quantity:     order.quantity,
    measurements: order.measurements || {},
    stage:        stage || 'general',
    fabricNotes:  order.fabricNotes  || '',
  }

  if (stage === 'stitching') {
    response.alteration = order.alteration
  }

  if (allotment && stage && allotment[stage]) {
    response.stageInfo = {
      status:     allotment[stage].status     || 'not_assigned',
      employeeID: allotment[stage].employeeID || '',
      notes:      allotment[stage].notes      || '',
    }
  } else {
    response.stageInfo = {
      status:     'not_assigned',
      employeeID: '',
      notes:      '',
    }
  }

  if (allotment) {
    response.allStages = {
      cutting:   { status: allotment.cutting?.status   || 'not_assigned' },
      stitching: { status: allotment.stitching?.status || 'not_assigned' },
      finishing: { status: allotment.finishing?.status || 'not_assigned' },
    }
  } else {
    response.allStages = {
      cutting:   { status: 'not_assigned' },
      stitching: { status: 'not_assigned' },
      finishing: { status: 'not_assigned' },
    }
  }

  return res.json(response)
}
// ── GET allotment for an order ───────────────────────────────
router.get('/:orderID', protect, async (req, res) => {
  try {
    const { orderID } = req.params

    const order = await Order.findOne({ orderID })
      .populate('customerRef', 'name phone customerID')
    if (!order)
      return res.status(404).json({ success:false, message:'Order not found' })

    let allotment = await Allotment.findOne({ orderID })

    if (!allotment) {
      const qrCode = await generateQR(orderID)
      allotment = await Allotment.create({
        orderID,
        customerID: order.customerID,
        qrCode,
      })
    }

    const enrichStage = async (stage) => {
      if (!stage.employeeID) return stage
      const emp = await Employee.findOne({ employeeID: stage.employeeID })
        .select('name employeeID role').lean()
      return { ...stage, employeeDetails: emp || null }
    }

    const cutting   = await enrichStage(allotment.cutting.toObject())
    const stitching = await enrichStage(allotment.stitching.toObject())
    const finishing = await enrichStage(allotment.finishing.toObject())

    res.json({
      success: true,
      allotment: { ...allotment.toObject(), cutting, stitching, finishing },
      order,
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// ── POST assign employee to stage ───────────────────────────
router.post('/:orderID/assign', protect, async (req, res) => {
  try {
    const { orderID }              = req.params
    const { stage, employeeID, notes } = req.body

    const validStages = ['cutting','stitching','finishing']
    if (!validStages.includes(stage))
      return res.status(400).json({ success:false, message:'Invalid stage' })

    const employee = await Employee.findOne({ employeeID, isActive:true })
    if (!employee)
      return res.status(404).json({ success:false, message:'Employee not found' })

    if (employee.role !== 'all' && employee.role !== stage)
      return res.status(400).json({
        success:  false,
        message:  `This employee is assigned to "${employee.role}" stage, not "${stage}"`,
      })

    let allotment = await Allotment.findOne({ orderID })
    if (!allotment) {
      const order = await Order.findOne({ orderID })
      if (!order)
        return res.status(404).json({ success:false, message:'Order not found' })
      const qrCode = await generateQR(orderID)
      allotment = await Allotment.create({
        orderID, customerID: order.customerID, qrCode,
      })
    }

    if (stage === 'stitching' && allotment.cutting.status !== 'completed')
      return res.status(400).json({
        success:  false,
        message:  'Cutting must be completed before assigning stitching',
      })

    if (stage === 'finishing' && allotment.stitching.status !== 'completed')
      return res.status(400).json({
        success:  false,
        message:  'Stitching must be completed before assigning finishing',
      })

    allotment[stage] = {
      employeeID:    employee.employeeID,
      employeeName:  employee.name,
      status:        'pending',
      assignedAt:    new Date(),
      adminApproved: false,
      award:         0,
      notes:         notes || '',
    }

    await allotment.save()

    const stageToStatus = {
      cutting:'Cutting', stitching:'Stitching', finishing:'Finishing',
    }
    await Order.findOneAndUpdate(
      { orderID },
      { $set:{ status: stageToStatus[stage] } }
    )

    res.json({ success:true, message:`${stage} assigned to ${employee.name}`, allotment })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// ── POST approve stage ───────────────────────────────────────
router.post('/:orderID/approve', protect, async (req, res) => {
  try {
    const { orderID }      = req.params
    const { stage, award } = req.body

    const validStages = ['cutting','stitching','finishing']
    if (!validStages.includes(stage))
      return res.status(400).json({ success:false, message:'Invalid stage' })

    const allotment = await Allotment.findOne({ orderID })
    if (!allotment)
      return res.status(404).json({ success:false, message:'Allotment not found' })

    if (allotment[stage].status !== 'pending')
      return res.status(400).json({
        success:  false,
        message:  `${stage} is not in pending state`,
      })

    allotment[stage].status        = 'completed'
    allotment[stage].adminApproved = true
    allotment[stage].approvedAt    = new Date()
    allotment[stage].completedAt   = new Date()
    allotment[stage].award         = parseFloat(award) || 0

    await allotment.save()

    if (stage === 'finishing') {
      const order = await Order.findOneAndUpdate(
        { orderID },
        { $set:{ status:'Ready For Delivery' } },
        { new:true }
      ).populate('customerRef', 'name phone customerID')

      if (order && order.customerRef) {
        try {
          const { sendOrderCompleteSMS } = require('../services/smsService')
          const SmsLog = require('../models/SmsLog')
          const message =
            `Dear ${order.customerRef.name}, your order ${orderID} ` +
            `(${order.clothType}) is ready for delivery! ` +
            `Please visit Al-Ameen Tailors to collect it. Thank you!`
          const smsResult = await sendOrderCompleteSMS(
            order.customerRef.name,
            order.customerRef.phone,
            orderID,
            order.clothType
          )
          await SmsLog.create({
            type:      'order_complete',
            title:     `Order ${orderID} Ready`,
            message,
            sentTo:    [{
              phone:      order.customerRef.phone,
              customerID: order.customerRef.customerID,
              name:       order.customerRef.name,
            }],
            sentCount: 1,
            status:    smsResult.success ? 'sent' : 'failed',
          })
        } catch (smsErr) {
          console.error('SMS error:', smsErr.message)
        }
      }
    }

    res.json({ success:true, message:`${stage} approved`, allotment })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// ── POST unassign stage ──────────────────────────────────────
router.post('/:orderID/unassign', protect, async (req, res) => {
  try {
    const { orderID } = req.params
    const { stage }   = req.body

    const validStages = ['cutting','stitching','finishing']
    if (!validStages.includes(stage))
      return res.status(400).json({ success:false, message:'Invalid stage' })

    const allotment = await Allotment.findOne({ orderID })
    if (!allotment)
      return res.status(404).json({ success:false, message:'Allotment not found' })

    if (allotment[stage].adminApproved)
      return res.status(400).json({
        success:  false,
        message:  'Cannot unassign an approved stage',
      })

    allotment[stage] = {
      employeeID:'', employeeName:'', status:'not_assigned',
      adminApproved:false, award:0, notes:'',
    }

    await allotment.save()
    res.json({ success:true, message:`${stage} unassigned`, allotment })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

module.exports = router
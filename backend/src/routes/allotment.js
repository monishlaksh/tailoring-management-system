const express    = require('express')
const Allotment  = require('../models/Allotment')
const Order      = require('../models/Order')
const Employee   = require('../models/Employee')
const { protect } = require('../middleware/auth')
const QRCode     = require('qrcode')
const router     = express.Router()

// ── Helper: generate QR code for an order ───────────────────
const generateQR = async (orderID) => {
  try {
    // QR encodes a URL that admin scans to open allotment page
    const url = `${process.env.FRONTEND_URL || 'https://tailoring-management-system.vercel.app'}/admin/allotment/${orderID}`
    const qr  = await QRCode.toDataURL(url, {
      width:     300,
      margin:    2,
      color:     { dark:'#1E1B4B', light:'#FFFFFF' },
    })
    return qr
  } catch (e) {
    console.error('QR generation error:', e.message)
    return ''
  }
}

// ── GET allotment for an order (create if not exists) ────────
router.get('/:orderID', protect, async (req, res) => {
  try {
    const { orderID } = req.params

    const order = await Order.findOne({ orderID })
      .populate('customerRef', 'name phone customerID')
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' })

    let allotment = await Allotment.findOne({ orderID })

    // Auto-create allotment record when first accessed
    if (!allotment) {
      const qrCode = await generateQR(orderID)
      allotment = await Allotment.create({
        orderID,
        customerID: order.customerID,
        qrCode,
      })
    }

    // Get employee details for each stage
    const enrichStage = async (stage) => {
      if (!stage.employeeID) return stage
      const emp = await Employee.findOne({ employeeID: stage.employeeID })
        .select('name employeeID role')
        .lean()
      return { ...stage, employeeDetails: emp || null }
    }

    const cutting   = await enrichStage(allotment.cutting.toObject())
    const stitching = await enrichStage(allotment.stitching.toObject())
    const finishing = await enrichStage(allotment.finishing.toObject())

    res.json({
      success: true,
      allotment: {
        ...allotment.toObject(),
        cutting,
        stitching,
        finishing,
      },
      order,
    })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── POST assign employee to a stage ─────────────────────────
router.post('/:orderID/assign', protect, async (req, res) => {
  try {
    const { orderID }    = req.params
    const { stage, employeeID, notes } = req.body

    const validStages = ['cutting', 'stitching', 'finishing']
    if (!validStages.includes(stage))
      return res.status(400).json({ success: false, message: 'Invalid stage' })

    const employee = await Employee.findOne({ employeeID, isActive: true })
    if (!employee)
      return res.status(404).json({ success: false, message: 'Employee not found' })

    // Check employee role matches stage
    if (employee.role !== 'all' && employee.role !== stage) {
      return res.status(400).json({
        success: false,
        message: `This employee is assigned to "${employee.role}" stage, not "${stage}"`,
      })
    }

    let allotment = await Allotment.findOne({ orderID })
    if (!allotment) {
      const order   = await Order.findOne({ orderID })
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' })
      const qrCode  = await generateQR(orderID)
      allotment     = await Allotment.create({ orderID, customerID: order.customerID, qrCode })
    }

    // Cannot assign if previous stage not completed
    if (stage === 'stitching' && allotment.cutting.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cutting must be completed before assigning stitching',
      })
    }
    if (stage === 'finishing' && allotment.stitching.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Stitching must be completed before assigning finishing',
      })
    }

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

    // Update order status to match current stage
    const stageToStatus = {
      cutting:   'Cutting',
      stitching: 'Stitching',
      finishing: 'Finishing',
    }
    await Order.findOneAndUpdate(
      { orderID },
      { $set: { status: stageToStatus[stage] } }
    )

    res.json({ success: true, message: `${stage} assigned to ${employee.name}`, allotment })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── POST admin approves a stage completion ───────────────────
router.post('/:orderID/approve', protect, async (req, res) => {
  try {
    const { orderID }      = req.params
    const { stage, award } = req.body

    const validStages = ['cutting', 'stitching', 'finishing']
    if (!validStages.includes(stage))
      return res.status(400).json({ success: false, message: 'Invalid stage' })

    const allotment = await Allotment.findOne({ orderID })
    if (!allotment)
      return res.status(404).json({ success: false, message: 'Allotment not found' })

    if (allotment[stage].status !== 'pending')
      return res.status(400).json({ success: false, message: `${stage} is not in pending state` })

    allotment[stage].status        = 'completed'
    allotment[stage].adminApproved = true
    allotment[stage].approvedAt    = new Date()
    allotment[stage].completedAt   = new Date()
    allotment[stage].award         = parseFloat(award) || 0

    await allotment.save()

    // If finishing completed → mark order as Ready For Delivery
    if (stage === 'finishing') {
      await Order.findOneAndUpdate(
        { orderID },
        { $set: { status: 'Ready For Delivery' } }
      )
    }

    res.json({ success: true, message: `${stage} approved`, allotment })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── POST unassign a stage (reset) — admin only ───────────────
router.post('/:orderID/unassign', protect, async (req, res) => {
  try {
    const { orderID } = req.params
    const { stage }   = req.body

    const validStages = ['cutting', 'stitching', 'finishing']
    if (!validStages.includes(stage))
      return res.status(400).json({ success: false, message: 'Invalid stage' })

    const allotment = await Allotment.findOne({ orderID })
    if (!allotment)
      return res.status(404).json({ success: false, message: 'Allotment not found' })

    // Cannot unassign if already approved
    if (allotment[stage].adminApproved)
      return res.status(400).json({ success: false, message: 'Cannot unassign an approved stage' })

    allotment[stage] = {
      employeeID:    '',
      employeeName:  '',
      status:        'not_assigned',
      adminApproved: false,
      award:         0,
      notes:         '',
    }

    await allotment.save()
    res.json({ success: true, message: `${stage} unassigned`, allotment })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── GET allotment by QR scan (public — no auth needed) ───────
// This is what employee sees when they scan QR
router.get('/scan/:orderID', async (req, res) => {
  try {
    const { orderID } = req.params
    const { stage }   = req.query // ?stage=cutting

    const order = await Order.findOne({ orderID }).lean()
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' })

    const allotment = await Allotment.findOne({ orderID }).lean()

    // Return only what employee needs — NO customer info
    const response = {
      success:  true,
      orderID:  order.orderID,
      clothType: order.clothType,
      quantity:  order.quantity,
      measurements: order.measurements,
      stage:    stage || 'general',
    }

    // Add alteration details for stitching stage
    if (stage === 'stitching') {
      response.alteration = order.alteration
    }

    // Add stage assignment info
    if (allotment && stage) {
      response.stageInfo = {
        status:       allotment[stage]?.status,
        assignedTo:   allotment[stage]?.employeeName,
        notes:        allotment[stage]?.notes,
      }
    }

    res.json(response)
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── GET all allotments — admin dashboard ─────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const allotments = await Allotment.find()
      .sort({ createdAt: -1 })
      .lean()
    res.json({ success: true, allotments })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})
// ── GET allotment by QR scan ─────────────────────────────────
// No auth required — works for both employee and admin scans
router.get('/scan/:orderID', async (req, res) => {
  try {
    const { orderID } = req.params
    const { stage }   = req.query

    const order = await Order.findOne({ orderID }).lean()
    if (!order)
      return res.status(404).json({ success:false, message:'Order not found' })

    const allotment = await Allotment.findOne({ orderID }).lean()

    // Employee sees: measurements + stage info + alterations for stitching
    // Customer info is intentionally excluded
    const response = {
      success:      true,
      orderID:      order.orderID,
      clothType:    order.clothType,
      quantity:     order.quantity,
      measurements: order.measurements,
      stage:        stage || 'general',
      fabricNotes:  order.fabricNotes,
    }

    // Only stitching sees alteration details
    if (stage === 'stitching') {
      response.alteration = order.alteration
    }

    // Stage assignment info
    if (allotment && stage && allotment[stage]) {
      response.stageInfo = {
        status:     allotment[stage].status,
        employeeID: allotment[stage].employeeID,
        notes:      allotment[stage].notes,
      }
    }

    // All stages summary for general scan
    if (allotment) {
      response.allStages = {
        cutting:   { status: allotment.cutting?.status   || 'not_assigned' },
        stitching: { status: allotment.stitching?.status || 'not_assigned' },
        finishing: { status: allotment.finishing?.status || 'not_assigned' },
      }
    }

    res.json(response)
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

module.exports = router
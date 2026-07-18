const express     = require('express')
const Allotment   = require('../models/Allotment')
const Order       = require('../models/Order')
const Employee    = require('../models/Employee')   // ← TOP LEVEL
const ClothType   = require('../models/ClothType')  // ← TOP LEVEL
const {
  protect,
  protectEmployee,
  protectAdminOrEmployee,
  protectAdminOrFullAccess,
} = require('../middleware/auth')

const QRCode      = require('qrcode')
const router      = express.Router()

// Import sendWA directly from whatsapp route
const { sendWA } = require('./whatsapp')

const generateQR = async (orderID) => {
  try {
    const url = `${process.env.FRONTEND_URL ||
      'https://tailoring-management-system.vercel.app'}/admin/allotment/${orderID}`
    return await QRCode.toDataURL(url, {
      width:300, margin:2,
      color:{ dark:'#1E1B4B', light:'#FFFFFF' },
    })
  } catch (e) {
    console.error('QR error:', e.message)
    return ''
  }
}

// GET all allotments
router.get('/', protectAdminOrFullAccess, async (req, res) => {
  try {
    const allotments = await Allotment.find()
      .sort({ createdAt:-1 }).lean()
    res.json({ success:true, allotments })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// GET scan — MUST be before /:orderID
router.get('/scan/:orderID', async (req, res) => {
  try {
    const cleanID = req.params.orderID.trim().toUpperCase()
    const stage   = (req.query.stage || 'general').toLowerCase()

    const order = await Order.findOne({ orderID:cleanID }).lean()
    if (!order)
      return res.status(404).json({
        success: false,
        message: `Order ${cleanID} not found`,
      })

    const allotment = await Allotment.findOne({ orderID:cleanID }).lean()

    const response = {
      success:      true,
      orderID:      order.orderID,
      clothType:    order.clothType,
      quantity:     order.quantity,
      measurements: order.measurements || {},
      fabricNotes:  order.fabricNotes  || '',
      stage,
      stageInfo: (allotment && stage !== 'general' && allotment[stage])
        ? {
            status:     allotment[stage].status     || 'not_assigned',
            employeeID: allotment[stage].employeeID || '',
            notes:      allotment[stage].notes      || '',
          }
        : { status:'not_assigned', employeeID:'', notes:'' },
      allStages: allotment
        ? {
            cutting:   { status:allotment.cutting?.status   || 'not_assigned' },
            stitching: { status:allotment.stitching?.status || 'not_assigned' },
            finishing: { status:allotment.finishing?.status || 'not_assigned' },
          }
        : {
            cutting:   { status:'not_assigned' },
            stitching: { status:'not_assigned' },
            finishing: { status:'not_assigned' },
          },
    }

    if (stage === 'stitching') {
      response.alteration = order.alteration
    }

    res.json(response)
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// GET single allotment — allow ANY employee to read (they need it for scan/view)
router.get('/:orderID', protectAdminOrEmployee, async (req, res) => {
  try {
    const { orderID } = req.params

    const order = await Order.findOne({ orderID })
      .populate('customerRef', 'name phone customerID address')
      .lean()

    if (!order)
      return res.status(404).json({ success:false, message:'Order not found' })

    let allotment = await Allotment.findOne({ orderID })

    if (!allotment) {
      // Auto-create allotment if it doesn't exist
      const qrCode = await generateQR(orderID)
      allotment = await Allotment.create({
        orderID,
        customerID: order.customerID,
        qrCode,
        delivery: { status:'pending' },
      })
    }

    // Ensure delivery field exists
    if (!allotment.delivery) {
      allotment.delivery = { status:'pending', deliveredAt:null, acknowledgedBy:'', notes:'' }
      await allotment.save()
    }

    // Serialize measurements Map
    const serializedOrder = {
      ...order,
      measurements: order.measurements instanceof Map
        ? Object.fromEntries(order.measurements)
        : (order.measurements || {}),
    }

    res.json({
      success:   true,
      allotment: allotment.toObject(),
      order:     serializedOrder,
    })
  } catch (e) {
    console.error('[ALLOTMENT GET]', e.message)
    res.status(500).json({ success:false, message:e.message })
  }
})

    const enrichStage = async (stage) => {
      if (!stage.employeeID) return stage
      const emp = await Employee.findOne({ employeeID:stage.employeeID })
        .select('name employeeID role').lean()
      return { ...stage, employeeDetails: emp || null }
    }

    const cutting   = await enrichStage(allotment.cutting.toObject())
    const stitching = await enrichStage(allotment.stitching.toObject())
    const finishing = await enrichStage(allotment.finishing.toObject())

    // Return full order object — all fields
    res.json({
      success:   true,
      allotment: {
        ...allotment.toObject(),
        cutting,
        stitching,
        finishing,
      },
      order: {
        orderID:             order.orderID,
        customerID:          order.customerID,
        clothType:           order.clothType,
        quantity:            order.quantity,        // ← explicit
        unitCost:            order.unitCost,
        amountSettled:       order.amountSettled,
        fabricNotes:         order.fabricNotes,
        specialInstructions: order.specialInstructions,
        measurements:        order.measurements,
        alteration:          order.alteration,
        deliveryDate:        order.deliveryDate,
        status:              order.status,
        voiceNote:           order.voiceNote,
        customerRef:         order.customerRef,
      },
    })

    // Ensure delivery field exists on old allotments
    if (!allotment.delivery) {
      allotment.delivery = { status:'pending', deliveredAt:null, acknowledgedBy:'', notes:'' }
      await allotment.save()
    }

  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST assign employee to stage
router.post('/:orderID/assign', protect, async (req, res) => {
  try {
    const { orderID }              = req.params
    const { stage, employeeID, notes } = req.body

    if (!['cutting','stitching','finishing'].includes(stage))
      return res.status(400).json({ success:false, message:'Invalid stage' })

    const employee = await Employee.findOne({ employeeID, isActive:true })
    if (!employee)
      return res.status(404).json({ success:false, message:'Employee not found' })

    if (employee.role !== 'all' && employee.role !== stage)
      return res.status(400).json({
        success: false,
        message: `Employee role is "${employee.role}", not "${stage}"`,
      })

    let allotment = await Allotment.findOne({ orderID })
    if (!allotment) {
      const order = await Order.findOne({ orderID })
      if (!order)
        return res.status(404).json({ success:false, message:'Order not found' })
      const qrCode = await generateQR(orderID)
      allotment = await Allotment.create({
        orderID, customerID:order.customerID, qrCode,
      })
    }

    if (stage === 'stitching' && allotment.cutting.status !== 'completed')
      return res.status(400).json({
        success: false, message:'Complete cutting first',
      })
    if (stage === 'finishing' && allotment.stitching.status !== 'completed')
      return res.status(400).json({
        success: false, message:'Complete stitching first',
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
      cutting:   'Cutting',
      stitching: 'Stitching',
      finishing: 'Finishing',
    }
    await Order.findOneAndUpdate(
      { orderID },
      { $set:{ status:stageToStatus[stage] } }
    )

    res.json({
      success: true,
      message: `${stage} assigned to ${employee.name}`,
      allotment,
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST approve stage — sends WhatsApp on finishing
// POST approve stage — auto award = empCost + employee.bonus
router.post('/:orderID/approve', protect, async (req, res) => {
  try {
    const { orderID } = req.params
    const { stage }   = req.body

    if (!['cutting','stitching','finishing'].includes(stage))
      return res.status(400).json({ success:false, message:'Invalid stage' })

    const allotment = await Allotment.findOne({ orderID })
    if (!allotment)
      return res.status(404).json({ success:false, message:'Allotment not found' })

    if (allotment[stage].status !== 'pending')
      return res.status(400).json({ success:false, message:`${stage} is not pending` })

    const order = await Order.findOne({ orderID })
    if (!order)
      return res.status(404).json({ success:false, message:'Order not found' })

    // ── Step 1: Get emp rate from cloth type ─────────────────
    const parts         = (order.clothType || '').split(' - ')
    const clothTypeName = parts[0]?.trim() || ''
    const typeName      = parts[1]?.trim() || ''
    let empRate = 0

    if (clothTypeName && typeName) {
      const ctDoc = await ClothType.findOne({ name: clothTypeName }).lean()
      if (ctDoc) {
        const matchedType = ctDoc.types?.find(
          t => t.name.toLowerCase() === typeName.toLowerCase()
        )
        empRate = matchedType?.empCost || 0
      }
    }

    console.log(`[APPROVE] ${stage} — clothType="${clothTypeName}" type="${typeName}" empRate=₹${empRate}`)

    // ── Step 2: Get bonus from employee profile ───────────────
    const employeeID = allotment[stage].employeeID
    let empBonus = 0

    if (employeeID) {
      const emp = await Employee.findOne({ employeeID }).lean()
      empBonus = emp?.bonus || 0
      console.log(`[APPROVE] Employee ${employeeID} bonus=₹${empBonus}`)
    }

    const totalAward = empRate + empBonus

    console.log(`[APPROVE] Total award = ₹${empRate} + ₹${empBonus} = ₹${totalAward}`)

    // ── Step 3: Save ──────────────────────────────────────────
    allotment[stage].status        = 'completed'
    allotment[stage].adminApproved = true
    allotment[stage].approvedAt    = new Date()
    allotment[stage].completedAt   = new Date()
    allotment[stage].award         = totalAward

    await allotment.save()

    // ── Step 4: If finishing — update order + WhatsApp ────────
    if (stage === 'finishing') {
      const updatedOrder = await Order.findOneAndUpdate(
        { orderID },
        { $set:{ status:'Ready For Delivery' } },
        { new:true }
      ).populate('customerRef', 'name phone customerID')

      if (updatedOrder?.customerRef?.phone) {
        try {
          const { sendWA } = require('./whatsapp')
          const waMsg =
            `🎉 *Al-Ameen Tailors*\n\n` +
            `Dear ${updatedOrder.customerRef.name},\n\n` +
            `Your order *${orderID}* (${updatedOrder.clothType}) is ` +
            `*Ready for Delivery!* ✅\n\n` +
            `Please visit our shop to collect your order.\n\n` +
            `Thank you for choosing Al-Ameen Tailors! ✂️`
          sendWA(updatedOrder.customerRef.phone, waMsg)
            .then(r  => console.log('[WA]', JSON.stringify(r)))
            .catch(e => console.error('[WA]', e.message))
        } catch (e) {
          console.error('[WA] import error:', e.message)
        }
      }
    }

    res.json({
      success:    true,
      message:    `${stage} approved — ₹${empRate} + ₹${empBonus} bonus = ₹${totalAward}`,
      empRate,
      empBonus,
      totalAward,
      allotment,
    })
  } catch (e) {
    console.error('[APPROVE]', e.message)
    res.status(500).json({ success:false, message:e.message })
  }
})// POST unassign stage
router.post('/:orderID/unassign', protect, async (req, res) => {
  try {
    const { orderID } = req.params
    const { stage }   = req.body

    if (!['cutting','stitching','finishing'].includes(stage))
      return res.status(400).json({ success:false, message:'Invalid stage' })

    const allotment = await Allotment.findOne({ orderID })
    if (!allotment)
      return res.status(404).json({ success:false, message:'Allotment not found' })

    if (allotment[stage].adminApproved)
      return res.status(400).json({
        success: false,
        message: 'Cannot unassign an approved stage',
      })

    allotment[stage] = {
      employeeID:    '',
      employeeName:  '',
      status:        'not_assigned',
      adminApproved: false,
      award:         0,
      notes:         '',
    }
    await allotment.save()
    res.json({ success:true, message:`${stage} unassigned`, allotment })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST mark as delivered — no employee needed
router.post('/:orderID/deliver', protect, async (req, res) => {
  try {
    const { orderID }                  = req.params
    const { notes, acknowledgedBy }    = req.body

    const allotment = await Allotment.findOne({ orderID })
    if (!allotment)
      return res.status(404).json({ success:false, message:'Allotment not found' })

    if (allotment.finishing.status !== 'completed')
      return res.status(400).json({
        success: false,
        message: 'Finishing stage must be completed before delivery',
      })

    if (allotment.delivery?.status === 'delivered')
      return res.status(400).json({ success:false, message:'Already marked as delivered' })

    allotment.delivery = {
      status:         'delivered',
      deliveredAt:    new Date(),
      acknowledgedBy: acknowledgedBy || 'Admin',
      notes:          notes || '',
    }

    await allotment.save()

    await Order.findOneAndUpdate(
      { orderID },
      { $set:{ status:'Delivered' } }
    )

    res.json({ success:true, message:'Order marked as delivered', allotment })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST undo delivery
router.post('/:orderID/undo-deliver', protect, async (req, res) => {
  try {
    const { orderID } = req.params

    const allotment = await Allotment.findOne({ orderID })
    if (!allotment)
      return res.status(404).json({ success:false, message:'Allotment not found' })

    allotment.delivery = {
      status:         'pending',
      deliveredAt:    null,
      acknowledgedBy: '',
      notes:          '',
    }

    await allotment.save()

    await Order.findOneAndUpdate(
      { orderID },
      { $set:{ status:'Ready For Delivery' } }
    )

    res.json({ success:true, message:'Delivery undone', allotment })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST give bonus to employee for a specific stage
router.post('/:orderID/bonus', protect, async (req, res) => {
  try {
    const { orderID }   = req.params
    const { stage, bonusAmount } = req.body

    if (!['cutting','stitching','finishing'].includes(stage))
      return res.status(400).json({ success:false, message:'Invalid stage' })

    const bonus = parseFloat(bonusAmount)
    if (!bonus || bonus <= 0)
      return res.status(400).json({ success:false, message:'Valid bonus amount required' })

    const allotment = await Allotment.findOne({ orderID })
    if (!allotment)
      return res.status(404).json({ success:false, message:'Allotment not found' })

    if (allotment[stage].status !== 'completed')
      return res.status(400).json({ success:false, message:'Stage must be completed to give bonus' })

    const prevAward = allotment[stage].award || 0
    allotment[stage].award = prevAward + bonus
    await allotment.save()

    res.json({
      success: true,
      message: `Bonus ₹${bonus} given for ${stage}`,
      newAward: allotment[stage].award,
      allotment,
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

module.exports = router
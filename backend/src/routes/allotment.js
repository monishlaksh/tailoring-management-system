const express    = require('express')
const Allotment  = require('../models/Allotment')
const Order      = require('../models/Order')
const Employee   = require('../models/Employee')
const { protect } = require('../middleware/auth')
const QRCode     = require('qrcode')
const router     = express.Router()

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

// Inline WhatsApp sender — no external dependency issues
const sendOrderCompleteWA = async (customerName, toPhone, orderID, clothType) => {
  const token   = process.env.WHATSAPP_TOKEN
  const phoneID = process.env.WHATSAPP_PHONE_ID

  if (!token || !phoneID) {
    console.log('⚠️ WhatsApp env vars missing — skipping')
    console.log(`  WHATSAPP_TOKEN: ${token ? 'SET' : 'NOT SET'}`)
    console.log(`  WHATSAPP_PHONE_ID: ${phoneID ? 'SET' : 'NOT SET'}`)
    return
  }

  const digits    = String(toPhone).replace(/\D/g, '')
  const formatted = digits.startsWith('91') ? digits : `91${digits}`

  const message =
    `🎉 *Al-Ameen Tailors*\n\n` +
    `Dear ${customerName},\n\n` +
    `Your order *${orderID}* (${clothType}) is *Ready for Delivery!* ✅\n\n` +
    `Please visit our shop to collect your order.\n\n` +
    `Thank you for choosing Al-Ameen Tailors! ✂️`

  console.log(`[WA] Sending order complete to: ${formatted}`)

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneID}/messages`,
      {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to:                formatted,
          type:              'text',
          text:              { body: message },
        }),
      }
    )
    const text = await res.text()
    console.log(`[WA] Status: ${res.status}, Response: ${text}`)
  } catch (e) {
    console.error(`[WA] Error: ${e.message}`)
  }
}

// GET all allotments
router.get('/', protect, async (req, res) => {
  try {
    const allotments = await Allotment.find().sort({ createdAt:-1 }).lean()
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
      return res.status(404).json({ success:false, message:`Order ${cleanID} not found` })

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

    if (stage === 'stitching') response.alteration = order.alteration
    res.json(response)
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// GET allotment for order
router.get('/:orderID', protect, async (req, res) => {
  try {
    const { orderID } = req.params
    const order = await Order.findOne({ orderID })
      .populate('customerRef','name phone customerID')
    if (!order)
      return res.status(404).json({ success:false, message:'Order not found' })

    let allotment = await Allotment.findOne({ orderID })
    if (!allotment) {
      const qrCode = await generateQR(orderID)
      allotment = await Allotment.create({
        orderID, customerID:order.customerID, qrCode,
      })
    }

    const enrichStage = async (stage) => {
      if (!stage.employeeID) return stage
      const emp = await Employee.findOne({ employeeID:stage.employeeID })
        .select('name employeeID role').lean()
      return { ...stage, employeeDetails:emp||null }
    }

    const cutting   = await enrichStage(allotment.cutting.toObject())
    const stitching = await enrichStage(allotment.stitching.toObject())
    const finishing = await enrichStage(allotment.finishing.toObject())

    res.json({
      success:   true,
      allotment: { ...allotment.toObject(), cutting, stitching, finishing },
      order,
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST assign employee
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
        success:  false,
        message:  `Employee role is "${employee.role}", not "${stage}"`,
      })

    let allotment = await Allotment.findOne({ orderID })
    if (!allotment) {
      const order = await Order.findOne({ orderID })
      if (!order)
        return res.status(404).json({ success:false, message:'Order not found' })
      const qrCode = await generateQR(orderID)
      allotment = await Allotment.create({ orderID, customerID:order.customerID, qrCode })
    }

    if (stage === 'stitching' && allotment.cutting.status !== 'completed')
      return res.status(400).json({ success:false, message:'Complete cutting first' })
    if (stage === 'finishing' && allotment.stitching.status !== 'completed')
      return res.status(400).json({ success:false, message:'Complete stitching first' })

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
    await Order.findOneAndUpdate({ orderID }, { $set:{ status:stageToStatus[stage] } })

    res.json({ success:true, message:`${stage} assigned to ${employee.name}`, allotment })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST approve stage
router.post('/:orderID/approve', protect, async (req, res) => {
  try {
    const { orderID }      = req.params
    const { stage, award } = req.body

    if (!['cutting','stitching','finishing'].includes(stage))
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

    // Finishing approved → mark Ready + send WhatsApp
    if (stage === 'finishing') {
      const order = await Order.findOneAndUpdate(
        { orderID },
        { $set:{ status:'Ready For Delivery' } },
        { new:true }
      ).populate('customerRef','name phone customerID')

      console.log(`[FINISHING] Order ${orderID} approved`)
      console.log(`[FINISHING] Customer: ${order?.customerRef?.name}`)
      console.log(`[FINISHING] Phone: ${order?.customerRef?.phone}`)

      if (order?.customerRef?.phone) {
        // Send WhatsApp — don't await so it doesn't block the response
        sendOrderCompleteWA(
          order.customerRef.name,
          order.customerRef.phone,
          orderID,
          order.clothType
        ).catch(e => console.error('[FINISHING] WA error:', e.message))
      } else {
        console.log('[FINISHING] No phone found for customer — WhatsApp skipped')
      }
    }

    res.json({ success:true, message:`${stage} approved`, allotment })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST unassign stage
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
      return res.status(400).json({ success:false, message:'Cannot unassign approved stage' })

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
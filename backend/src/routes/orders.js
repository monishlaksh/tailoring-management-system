const express          = require('express')
const Order            = require('../models/Order')
const Customer         = require('../models/Customer')
const DeliveryCalendar = require('../models/DeliveryCalendar')
const Allotment = require('../models/Allotment')
const QRCode    = require('qrcode')
const {
  protect,
  protectAdminOrEmployee,
  protectAdminOrFullAccess,
  protectCustomer,
} = require('../middleware/auth')
const router = express.Router()

const getNextOrderID = async () => {
  const last = await Order.findOne().sort({ orderID:-1 }).select('orderID').lean()
  if (!last || !last.orderID) return 'ORD000001'
  const num  = parseInt(last.orderID.replace('ORD',''), 10)
  const next = isNaN(num) ? 1 : num + 1
  let newID  = `ORD${String(next).padStart(6,'0')}`
  let exists = await Order.findOne({ orderID:newID }).lean()
  let counter = next
  while (exists) {
    counter++
    newID  = `ORD${String(counter).padStart(6,'0')}`
    exists = await Order.findOne({ orderID:newID }).lean()
  }
  return newID
}

// Stats — admin only
router.get('/stats/dashboard', protect, async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [result] = await Order.aggregate([
      {
        $group: {
          _id: null,

          total: { $sum: 1 },

          booking: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Booking'] }, 1, 0]
            }
          },

          cutting: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Cutting'] }, 1, 0]
            }
          },

          stitching: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Stitching'] }, 1, 0]
            }
          },

          finishing: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Finishing'] }, 1, 0]
            }
          },

          ready: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'Ready For Delivery'] },
                1,
                0
              ]
            }
          },

          todayDelivery: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$deliveryDate', today] },
                    { $lt: ['$deliveryDate', tomorrow] }
                  ]
                },
                1,
                0
              ]
            }
          },

          delayed: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$deliveryDate', today] },
                    { $ne: ['$status', 'Ready For Delivery'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ])

    res.json({
      success: true,
      stats: result || {
        total: 0,
        booking: 0,
        cutting: 0,
        stitching: 0,
        finishing: 0,
        ready: 0,
        todayDelivery: 0,
        delayed: 0
      }
    })

  } catch (e) {
    console.error('[DASHBOARD STATS]', e)
    res.status(500).json({
      success: false,
      message: e.message
    })
  }
})

// GET all orders — admin only
// Helper to convert order Map fields to plain objects
const serializeOrder = (order) => {
  const obj = order.toObject ? order.toObject() : order
  if (obj.measurements instanceof Map) {
    obj.measurements = Object.fromEntries(obj.measurements)
  } else if (obj.measurements && typeof obj.measurements === 'object') {
    // Already plain object, keep as is
  }
  return obj
}

// GET all orders
// GET all orders — admin, manager, receptionist
router.get('/', protectAdminOrFullAccess, async (req, res) => {
  try {
    const { search, status, customerID } = req.query
    let query = {}
    if (status)     query.status     = status
    if (customerID) query.customerID = customerID
    if (search) {
      query.$or = [
        { orderID:    { $regex:search, $options:'i' } },
        { customerID: { $regex:search, $options:'i' } },
        { clothType:  { $regex:search, $options:'i' } },
      ]
    }
    const orders = await Order.find(query)
  .select(
    '_id orderID customerID clothType quantity status deliveryDate createdBy customerRef createdAt'
  )
  .populate('customerRef', 'name phone customerID')
  .sort({ createdAt: -1 })
  .lean()

    const serialized = orders.map(o => ({
      ...o,
      measurements: o.measurements instanceof Map
        ? Object.fromEntries(o.measurements)
        : (o.measurements || {}),
    }))

    res.json({ success:true, count:serialized.length, orders:serialized })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// ── GET customer's own orders ─────────────────────────────────
// MUST be before /:orderID route
router.get('/my-orders', protectCustomer, async (req, res) => {
  try {
    const customerID = req.customer?.customerID

    if (!customerID) {
      return res.status(400).json({
        success: false,
        message: 'No customer ID in token',
      })
    }

    console.log('[MY-ORDERS] Fetching for customerID:', customerID)

    const orders = await Order.find({ customerID })
      .sort({ createdAt: -1 })
      .lean()

    console.log('[MY-ORDERS] Found:', orders.length)

    const serialized = orders.map(o => ({
      ...o,
      measurements: o.measurements instanceof Map
        ? Object.fromEntries(o.measurements)
        : (o.measurements || {}),
    }))

    res.json({ success: true, count: serialized.length, orders: serialized })
  } catch (e) {
    console.error('[MY-ORDERS]', e.message)
    res.status(500).json({ success: false, message: e.message })
  }
})


// GET single order
router.get('/:orderID', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ orderID:req.params.orderID })
      .populate('customerRef','name phone customerID address')
      .lean()
    if (!order)
      return res.status(404).json({ success:false, message:'Order not found' })

    const serialized = {
      ...order,
      measurements: order.measurements instanceof Map
        ? Object.fromEntries(order.measurements)
        : (order.measurements || {}),
    }

    res.json({ success:true, order:serialized })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})


// POST create order — admin or full access employee
// POST create order
router.post('/', protectAdminOrFullAccess, async (req, res) => {
  try {
    const {
      customerID, clothType, quantity,
      unitCost, amountSettled,
      fabricNotes, specialInstructions,
      measurements, alteration, deliveryDate,
      voiceNote, empRate,
    } = req.body

    // In POST create order route:
    const Allotment = require('../models/Allotment')
    const QRCode    = require('qrcode')

    let createdByName = 'Admin'
    let createdByRole = 'admin'
    let createdByID   = ''

    if (req.employee && req.employee.name) {
      createdByName = req.employee.name
      createdByRole = req.employee.accessRole || req.role || 'employee'
      createdByID   = req.employee.employeeID || ''
    } else if (req.admin) {
      createdByName = req.admin?.username || 'Admin'
      createdByRole = 'admin'
    }

console.log('[CREATED BY]', { createdByName, createdByRole, createdByID, role: req.role, employee: req.employee })
    if (!customerID)
      return res.status(400).json({ success:false, message:'Customer ID required' })
    if (!clothType)
      return res.status(400).json({ success:false, message:'Cloth type required' })
    if (!deliveryDate)
      return res.status(400).json({ success:false, message:'Delivery date required' })

    const customer = await Customer.findOne({ customerID })
    if (!customer)
      return res.status(404).json({ success:false, message:'Customer not found' })

    const orderID = await getNextOrderID()
    // In POST create order:
      const order = await Order.create({
        orderID,
        customerID,
        customerRef:         customer._id,
        clothType,
        quantity:            quantity    || 1,
        unitCost:            unitCost    || 0,
        amountSettled:       amountSettled || 0,
        fabricNotes:         fabricNotes || '',
        specialInstructions: specialInstructions || '',
        measurements:        measurements || {},
        alteration:          alteration  || { required:false, selectedOptions:[], notes:'', extraCost:0 },
        deliveryDate,
        empRate: parseFloat(empRate) || 0,
        voiceNote:           voiceNote   || { data:'', mimeType:'audio/webm', duration:0 },
        createdBy: {
    role:       createdByRole,
    employeeID: createdByID,
    name:       createdByName,  // ← this will now show "Jesudoss" etc
  },
})


      // Save measurements to customer profile
      if (measurements && Object.values(measurements).some(v => v?.trim?.())) {
        await Customer.findOneAndUpdate(
          { customerID },
          { $set:{ measurements, measurementsUpdatedAt:new Date() } }
        )
      }

     

      // ── Immediately create allotment so redirect doesn't fail ──
      try {
        const qrData  = `${process.env.FRONTEND_URL}/scan/${order.orderID}`
        const qrCode  = await QRCode.toDataURL(qrData, {
          width:300, margin:2,
          color:{ dark:'#1E1B4B', light:'#FFFFFF' },
        })
        await Allotment.create({
          orderID:    order.orderID,
          customerID: order.customerID,
          qrCode,
          delivery:   { status:'pending' },
        })
      } catch (allotErr) {
        // Non-critical — allotment will be auto-created on first GET
        console.error('[ALLOTMENT CREATE]', allotErr.message)
      }

      // Save measurements to customer...

      // Return serialized
      const serialized = order.toObject()
      if (serialized.measurements instanceof Map) {
        serialized.measurements = Object.fromEntries(serialized.measurements)
      }
      res.status(201).json({ success:true, message:'Order created', order:serialized })

  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// PUT update order
router.put('/:orderID', protectAdminOrFullAccess, async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { orderID:req.params.orderID },
      req.body,
      { new:true, runValidators:true }
    ).populate('customerRef','name phone customerID')

    if (!order)
      return res.status(404).json({ success:false, message:'Order not found' })

    // ── Sync measurements to customer profile ────────────────
    if (req.body.measurements &&
        Object.values(req.body.measurements).some(v => v?.trim())) {
      await Customer.findOneAndUpdate(
        { customerID: order.customerID },
        { $set:{ measurements:req.body.measurements, measurementsUpdatedAt:new Date() } }
      )
    }

    res.json({ success:true, message:'Order updated', order })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})
// GET customer measurements
router.get('/:customerID/measurements', protectAdminOrEmployee, async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerID:req.params.customerID })
      .select('customerID name measurements measurementsUpdatedAt')
      .lean()
    if (!customer)
      return res.status(404).json({ success:false, message:'Customer not found' })

    // Convert Map to plain object if needed
    const measurements = customer.measurements instanceof Map
      ? Object.fromEntries(customer.measurements)
      : customer.measurements || {}

    res.json({
      success:              true,
      measurements,
      measurementsUpdatedAt: customer.measurementsUpdatedAt,
      hasMeasurements:      Object.values(measurements).some(v => v),
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})
// PATCH status — admin only
router.patch('/:orderID/status', protect, async (req, res) => {
  try {
    const { status } = req.body
    const valid = ['Booking','Cutting','Stitching','Finishing','Ready For Delivery','Delivered']
    if (!valid.includes(status))
      return res.status(400).json({ success:false, message:'Invalid status' })
    const order = await Order.findOneAndUpdate(
      { orderID:req.params.orderID },
      { $set:{ status } },
      { new:true }
    ).populate('customerRef','name phone customerID')
    if (!order)
      return res.status(404).json({ success:false, message:'Order not found' })
    res.json({ success:true, message:`Status updated to ${status}`, order })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// DELETE order — admin or full access employee
router.delete('/:orderID', protectAdminOrFullAccess, async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ orderID:req.params.orderID })
    if (!order)
      return res.status(404).json({ success:false, message:'Order not found' })
    res.json({ success:true, message:'Order deleted' })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})
// POST record payment for an order
router.post('/:orderID/payment', protectAdminOrFullAccess, async (req, res) => {
  try {
    const {
      method, amount, gpayRef, notes, cashBreakdown,
    } = req.body

    if (!method || !amount || amount <= 0)
      return res.status(400).json({
        success: false,
        message: 'Payment method and amount required',
      })

    const order = await Order.findOne({ orderID: req.params.orderID })
    if (!order)
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      })

    const totalCost    = order.unitCost || 0
    const alreadyPaid  = order.payment?.amountPaid || 0
    const newTotal     = alreadyPaid + parseFloat(amount)
    const due          = Math.max(totalCost - newTotal, 0)

    // Push to history
    if (!order.payment) {
      order.payment = {
        method: 'unpaid', amountPaid: 0, amountDue: order.unitCost || 0,
        gpayRef: '', notes: '', cashBreakdown: {}, history: [],
      }
    }
    if (!order.payment.history) order.payment.history = []
    order.payment.history.push({
      method,
      amount:        parseFloat(amount),
      paidAt:        new Date(),
      notes:         notes || '',
      cashBreakdown: cashBreakdown || {},
    })

    // Update totals
    order.payment.method     = method
    order.payment.amountPaid = newTotal
    order.payment.amountDue  = due
    order.payment.paidAt     = new Date()
    if (gpayRef) order.payment.gpayRef = gpayRef
    if (notes)   order.payment.notes   = notes
    if (cashBreakdown) order.payment.cashBreakdown = cashBreakdown

    // Also update legacy amountSettled
    order.amountSettled = newTotal

    order.markModified('payment')
    await order.save()

    res.json({
      success: true,
      message: 'Payment recorded',
      payment: order.payment,
    })
  } catch (e) {
    console.error('[PAYMENT]', e.message)
    res.status(500).json({ success: false, message: e.message })
  }
})

// DELETE reset payment
router.delete('/:orderID/payment', protectAdminOrFullAccess, async (req, res) => {
  try {
    const order = await Order.findOne({ orderID: req.params.orderID })
    if (!order)
      return res.status(404).json({ success:false, message:'Order not found' })

    order.payment = {
      method:'unpaid', amountPaid:0,
      amountDue: order.unitCost || 0,
      cashBreakdown:{}, history:[],
    }
    order.amountSettled = 0
    await order.save()

    res.json({ success:true, message:'Payment reset' })
  } catch (e) {
  console.error('[PAYMENT ERROR]', e.message, e.stack)
  res.status(500).json({ success:false, message:e.message })
}
})

module.exports = router
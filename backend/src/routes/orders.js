const express          = require('express')
const Order            = require('../models/Order')
const Customer         = require('../models/Customer')
const DeliveryCalendar = require('../models/DeliveryCalendar')
const { protect, protectAdminOrEmployee, protectCustomer } = require('../middleware/auth')
const router = express.Router()

// ── Generate next Order ID ───────────────────────────────────
const getNextOrderID = async () => {
  const last = await Order.findOne()
    .sort({ orderID: -1 })
    .select('orderID')
    .lean()
  if (!last || !last.orderID) return 'ORD000001'
  const num  = parseInt(last.orderID.replace('ORD', ''), 10)
  const next = isNaN(num) ? 1 : num + 1
  let newID  = `ORD${String(next).padStart(6, '0')}`
  let exists = await Order.findOne({ orderID: newID }).lean()
  let counter = next
  while (exists) {
    counter++
    newID  = `ORD${String(counter).padStart(6, '0')}`
    exists = await Order.findOne({ orderID: newID }).lean()
  }
  return newID
}

// ── Dashboard stats — admin only ─────────────────────────────
router.get('/stats/dashboard', protect, async (req, res) => {
  try {
    const today    = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [total, booking, cutting, stitching, finishing, ready, todayDelivery, delayed] =
      await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: 'Booking' }),
        Order.countDocuments({ status: 'Cutting' }),
        Order.countDocuments({ status: 'Stitching' }),
        Order.countDocuments({ status: 'Finishing' }),
        Order.countDocuments({ status: 'Ready For Delivery' }),
        Order.countDocuments({ deliveryDate: { $gte: today, $lt: tomorrow } }),
        Order.countDocuments({
          deliveryDate: { $lt: today },
          status: { $ne: 'Ready For Delivery' },
        }),
      ])

    res.json({
      success: true,
      stats: { total, booking, cutting, stitching, finishing, ready, todayDelivery, delayed },
    })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── Get all orders — admin sees all, employee sees own only ──
router.get('/', protectAdminOrEmployee, async (req, res) => {
  try {
    const { search, status, customerID } = req.query
    let query = {}

    if (req.role === 'employee') {
      query['createdBy.employeeID'] = req.employee.employeeID
    }

    if (status)     query.status     = status
    if (customerID) query.customerID = customerID

    if (search) {
      query.$or = [
        { orderID:    { $regex: search, $options: 'i' } },
        { customerID: { $regex: search, $options: 'i' } },
        { clothType:  { $regex: search, $options: 'i' } },
      ]
    }

    const orders = await Order.find(query)
      .populate('customerRef', 'name phone customerID')
      .sort({ createdAt: -1 })

    res.json({ success: true, count: orders.length, orders })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── Get orders for logged-in customer ───────────────────────
router.get('/my-orders', protectCustomer, async (req, res) => {
  try {
    const orders = await Order.find({ customerID: req.customer.customerID })
      .sort({ createdAt: -1 })
    res.json({ success: true, count: orders.length, orders })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── Get single order ─────────────────────────────────────────
router.get('/:orderID', protectAdminOrEmployee, async (req, res) => {
  try {
    const order = await Order.findOne({ orderID: req.params.orderID })
      .populate('customerRef', 'name phone customerID address')

    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' })

    if (req.role === 'employee' &&
        order.createdBy?.employeeID !== req.employee.employeeID)
      return res.status(403).json({ success: false, message: 'Access denied' })

    res.json({ success: true, order })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── Create order — admin or employee ────────────────────────
router.post('/', protectAdminOrEmployee, async (req, res) => {
  try {
    const {
      customerID, clothType, quantity,
      fabricNotes, specialInstructions,
      measurements, alteration,
      deliveryDate, referenceImage,
    } = req.body

    if (!customerID)
      return res.status(400).json({ success: false, message: 'Customer ID required' })
    if (!clothType)
      return res.status(400).json({ success: false, message: 'Cloth type required' })
    if (!deliveryDate)
      return res.status(400).json({ success: false, message: 'Delivery date required' })

    const customer = await Customer.findOne({ customerID })
    if (!customer)
      return res.status(404).json({ success: false, message: 'Customer not found' })

    const orderID = await getNextOrderID()

    const createdBy = req.role === 'employee'
      ? { role: 'employee', employeeID: req.employee.employeeID, name: req.employee.name }
      : { role: 'admin', employeeID: '', name: 'Admin' }

    const order = await Order.create({
      orderID,
      customerID,
      customerRef:         customer._id,
      clothType,
      quantity:            quantity || 1,
      fabricNotes:         fabricNotes || '',
      specialInstructions: specialInstructions || '',
      measurements:        measurements || {},
      alteration:          alteration || { required: false, notes: '' },
      deliveryDate,
      referenceImage:      referenceImage || '',
      createdBy,
    })

    const dateStr = new Date(deliveryDate).toISOString().split('T')[0]
    await DeliveryCalendar.findOneAndUpdate(
      { date: dateStr, clothType },
      { $inc: { pieceCount: quantity || 1 } },
      { upsert: true, new: true }
    )

    res.status(201).json({ success: true, message: 'Order created', order })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── Update full order — admin only ───────────────────────────
router.put('/:orderID', protect, async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { orderID: req.params.orderID },
      req.body,
      { new: true, runValidators: true }
    ).populate('customerRef', 'name phone customerID')

    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' })

    res.json({ success: true, message: 'Order updated', order })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── Update status — admin or employee ───────────────────────
router.patch('/:orderID/status', protectAdminOrEmployee, async (req, res) => {
  try {
    const { status } = req.body
    const valid = ['Booking', 'Cutting', 'Stitching', 'Finishing', 'Ready For Delivery']

    if (!valid.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' })

    // Find order first to check ownership
    const existing = await Order.findOne({ orderID: req.params.orderID }).lean()
    if (!existing)
      return res.status(404).json({ success: false, message: 'Order not found' })

    // Employee can only update their own orders
    if (req.role === 'employee') {
      if (existing.createdBy?.employeeID !== req.employee.employeeID) {
        return res.status(403).json({
          success: false,
          message: 'You can only update status of your own orders',
        })
      }
    }

    // Use $set to only update status — no validation on other fields
    const order = await Order.findOneAndUpdate(
      { orderID: req.params.orderID },
      { $set: { status: status } },
      { new: true }
    ).populate('customerRef', 'name phone customerID')

    res.json({ success: true, message: `Status updated to ${status}`, order })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── Delete order — admin only ────────────────────────────────
router.delete('/:orderID', protect, async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ orderID: req.params.orderID })
    if (!order)
      return res.status(404).json({ success: false, message: 'Order not found' })
    res.json({ success: true, message: 'Order deleted' })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

module.exports = router
const express          = require('express')
const Order            = require('../models/Order')
const Customer         = require('../models/Customer')
const DeliveryCalendar = require('../models/DeliveryCalendar')
const { protect, protectCustomer } = require('../middleware/auth')
const router = express.Router()

// Dashboard stats
router.get('/stats/dashboard', protect, async (req, res) => {
  try {
    const today    = new Date(); today.setHours(0,0,0,0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
    const [total, booking, cutting, stitching, finishing, ready, todayDelivery, delayed] =
      await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: 'Booking' }),
        Order.countDocuments({ status: 'Cutting' }),
        Order.countDocuments({ status: 'Stitching' }),
        Order.countDocuments({ status: 'Finishing' }),
        Order.countDocuments({ status: 'Ready For Delivery' }),
        Order.countDocuments({ deliveryDate: { $gte: today, $lt: tomorrow } }),
        Order.countDocuments({ deliveryDate: { $lt: today }, status: { $ne: 'Ready For Delivery' } }),
      ])
    res.json({ success: true, stats: { total, booking, cutting, stitching, finishing, ready, todayDelivery, delayed } })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// Get all orders (admin)
router.get('/', protect, async (req, res) => {
  try {
    const { search, status, customerID } = req.query
    let query = {}
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
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// Get orders for logged-in customer
router.get('/my-orders', protectCustomer, async (req, res) => {
  try {
    const orders = await Order.find({ customerID: req.customer.customerID })
      .sort({ createdAt: -1 })
    res.json({ success: true, count: orders.length, orders })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// Get single order
router.get('/:orderID', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ orderID: req.params.orderID })
      .populate('customerRef', 'name phone customerID address')
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' })
    res.json({ success: true, order })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// Create order
router.post('/', protect, async (req, res) => {
  try {
    const { customerID, clothType, quantity, fabricNotes, specialInstructions,
            measurements, alteration, deliveryDate, referenceImage } = req.body
    const customer = await Customer.findOne({ customerID })
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' })
    const order = await Order.create({
      customerID, customerRef: customer._id, clothType, quantity,
      fabricNotes, specialInstructions, measurements, alteration,
      deliveryDate, referenceImage,
    })
    const dateStr = new Date(deliveryDate).toISOString().split('T')[0]
    await DeliveryCalendar.findOneAndUpdate(
      { date: dateStr, clothType },
      { $inc: { pieceCount: quantity || 1 } },
      { upsert: true, new: true }
    )
    res.status(201).json({ success: true, message: 'Order created', order })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// Update order
router.put('/:orderID', protect, async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { orderID: req.params.orderID }, req.body,
      { new: true, runValidators: true }
    ).populate('customerRef', 'name phone customerID')
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' })
    res.json({ success: true, message: 'Order updated', order })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// Update status only
router.patch('/:orderID/status', protect, async (req, res) => {
  try {
    const { status } = req.body
    const valid = ['Booking','Cutting','Stitching','Finishing','Ready For Delivery']
    if (!valid.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' })
    const order = await Order.findOneAndUpdate(
      { orderID: req.params.orderID }, { status }, { new: true }
    )
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' })
    res.json({ success: true, message: `Status updated to ${status}`, order })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

// Delete order
router.delete('/:orderID', protect, async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ orderID: req.params.orderID })
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' })
    res.json({ success: true, message: 'Order deleted' })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

module.exports = router
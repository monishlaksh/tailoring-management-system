const express  = require('express')
const Customer = require('../models/Customer')
const Order    = require('../models/Order')
const {
  protect,
  protectAdminOrEmployee,
  protectAdminOrFullAccess,
} = require('../middleware/auth')
const router = express.Router()

const getNextCustomerID = async () => {
  const last = await Customer.findOne().sort({ customerID:-1 }).select('customerID').lean()
  if (!last || !last.customerID) return 'CUST000001'
  const num  = parseInt(last.customerID.replace('CUST',''), 10)
  const next = isNaN(num) ? 1 : num + 1
  let newID  = `CUST${String(next).padStart(6,'0')}`
  let exists = await Customer.findOne({ customerID:newID }).lean()
  let counter = next
  while (exists) {
    counter++
    newID  = `CUST${String(counter).padStart(6,'0')}`
    exists = await Customer.findOne({ customerID:newID }).lean()
  }
  return newID
}

// Payment summary — BEFORE /:customerID
router.get('/stats/payment-summary', protect, async (req, res) => {
  try {
    const [customers, orderSummary] = await Promise.all([
      Customer.find({ isActive: true })
        .select('customerID name')
        .lean(),

      Order.aggregate([
        {
          $group: {
            _id: '$customerID',
            totalCost: {
              $sum: { $ifNull: ['$unitCost', 0] }
            },
            totalSettled: {
              $sum: { $ifNull: ['$amountSettled', 0] }
            }
          }
        }
      ])
    ])

    const orderMap = new Map(
      orderSummary.map(o => [
        o._id,
        {
          totalCost: o.totalCost || 0,
          totalSettled: o.totalSettled || 0
        }
      ])
    )

    let totalPending = 0
    let totalCostAll = 0
    let totalSettledAll = 0

    const customersWithDue = []

    for (const customer of customers) {
      const data = orderMap.get(customer.customerID) || {
        totalCost: 0,
        totalSettled: 0
      }

      const totalCost = data.totalCost
      const totalSettled = data.totalSettled
      const balance = totalCost - totalSettled

      totalCostAll += totalCost
      totalSettledAll += totalSettled

      if (balance > 0) {
        totalPending += balance

        customersWithDue.push({
          customerID: customer.customerID,
          name: customer.name,
          totalCost,
          settled: totalSettled,
          balance
        })
      }
    }

    res.json({
      success: true,
      summary: {
        totalCostAll,
        totalSettledAll,
        totalBalance: totalPending,
        customersWithDue,
        customersWithDueCount: customersWithDue.length
      }
    })

  } catch (e) {
    console.error('[PAYMENT SUMMARY]', e)
    res.status(500).json({
      success: false,
      message: e.message
    })
  }
})

// GET all — admin or employee
router.get('/', protectAdminOrEmployee, async (req, res) => {
  try {
    const { search } = req.query
    let query = { isActive:true }
    if (search) {
      query.$or = [
        { name:       { $regex:search, $options:'i' } },
        { phone:      { $regex:search, $options:'i' } },
        { customerID: { $regex:search, $options:'i' } },
      ]
    }
    const customers = await Customer.find(query).sort({ createdAt:-1 })
    res.json({ success:true, count:customers.length, customers })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// GET single — admin or employee
router.get('/:customerID', protectAdminOrEmployee, async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerID:req.params.customerID })
    if (!customer)
      return res.status(404).json({ success:false, message:'Customer not found' })
    res.json({ success:true, customer })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// GET customer measurements
router.get('/:customerID/measurements', protectAdminOrEmployee, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      customerID: req.params.customerID,
      isActive:   true,
    }).lean() // ← use .lean() to get plain object

    if (!customer)
      return res.status(404).json({ success:false, message:'Customer not found' })

    // Handle both Map and plain object
    let measurements = {}
    if (customer.measurements) {
      if (customer.measurements instanceof Map) {
        measurements = Object.fromEntries(customer.measurements)
      } else {
        measurements = customer.measurements
      }
    }

    const hasMeasurements = Object.values(measurements).some(v => v && v.trim?.() !== '')

    res.json({
      success:              true,
      measurements,
      measurementsUpdatedAt: customer.measurementsUpdatedAt || null,
      hasMeasurements,
    })
  } catch (e) {
    console.error('[MEASUREMENTS]', e.message)
    res.status(500).json({ success:false, message:e.message })
  }
})

// GET payment detail — admin only
router.get('/:customerID/payment', protect, async (req, res) => {
  try {
    const orders       = await Order.find({ customerID:req.params.customerID }).lean()
    const totalCost    = orders.reduce((s,o) => s+(o.unitCost||0), 0)
    const totalSettled = orders.reduce((s,o) => s+(o.amountSettled||0), 0)
    const orderBreakdown = orders.map(o => ({
      orderID:o.orderID, clothType:o.clothType, quantity:o.quantity,
      unitCost:o.unitCost||0, amountSettled:o.amountSettled||0,
      balance:(o.unitCost||0)-(o.amountSettled||0),
    }))
    res.json({ success:true,
      payment:{ totalCost, amountSettled:totalSettled, balance:totalCost-totalSettled },
      orderBreakdown })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST create — admin or full access employee
router.post('/', protectAdminOrFullAccess, async (req, res) => {
  try {
    const { name, phone, address, notes } = req.body
    if (!name || !phone)
      return res.status(400).json({ success:false, message:'Name and phone required' })
    const existing = await Customer.findOne({ phone, isActive:true })
    if (existing)
      return res.status(400).json({ success:false, message:'Phone number already exists' })
    const customerID = await getNextCustomerID()
    const customer   = await Customer.create({ customerID, name, phone, address, notes })
    res.status(201).json({ success:true, message:'Customer created', customer })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// PUT update — admin only
router.put('/:customerID', protectAdminOrFullAccess, async (req, res) => {
  try {
    const { name, phone, address, notes } = req.body
    const customer = await Customer.findOneAndUpdate(
      { customerID:req.params.customerID },
      { name, phone, address, notes },
      { new:true, runValidators:true }
    )
    if (!customer)
      return res.status(404).json({ success:false, message:'Customer not found' })
    res.json({ success:true, message:'Customer updated', customer })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// PATCH payment — admin only
router.patch('/:customerID/payment', protect, async (req, res) => {
  try {
    const { amountSettled } = req.body
    if (amountSettled === undefined)
      return res.status(400).json({ success:false, message:'amountSettled required' })
    const settled  = parseFloat(amountSettled) || 0
    const orders   = await Order.find({ customerID:req.params.customerID }).lean()
    const total    = orders.reduce((s,o) => s+(o.unitCost||0), 0)
    if (settled > total)
      return res.status(400).json({ success:false, message:`Settled cannot exceed ₹${total}` })
    const customer = await Customer.findOneAndUpdate(
      { customerID:req.params.customerID },
      { amountSettled:settled },
      { new:true }
    )
    if (!customer)
      return res.status(404).json({ success:false, message:'Customer not found' })
    res.json({ success:true, message:'Payment updated',
      payment:{ totalCost:total, amountSettled:settled, balance:total-settled } })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// DELETE — admin only
router.delete('/:customerID', protect, async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { customerID:req.params.customerID },
      { isActive:false },
      { new:true }
    )
    if (!customer)
      return res.status(404).json({ success:false, message:'Customer not found' })
    res.json({ success:true, message:'Customer deleted' })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST bulk payment across all customer orders
router.post('/:customerID/pay', protectAdminOrFullAccess, async (req, res) => {
  try {
    const { customerID } = req.params
    const { method, amount, gpayRef, notes, cashBreakdown } = req.body

    if (!amount || amount <= 0)
      return res.status(400).json({ success:false, message:'Invalid amount' })

    // Get all unpaid/partial orders for this customer
    const orders = await Order.find({
      customerID,
      isActive: { $ne: false },
    }).sort({ createdAt: 1 }).lean() // oldest first

    if (!orders.length)
      return res.status(404).json({ success:false, message:'No orders found' })

    let remaining   = parseFloat(amount)
    const breakdown = []

    for (const order of orders) {
      if (remaining <= 0) break

      const totalCost   = order.unitCost || 0
      const alreadyPaid = order.payment?.amountPaid || order.amountSettled || 0
      const orderDue    = Math.max(totalCost - alreadyPaid, 0)

      if (orderDue <= 0) continue // already fully paid

      const payThis = Math.min(remaining, orderDue)
      remaining    -= payThis

      const newPaid = alreadyPaid + payThis
      const newDue  = Math.max(totalCost - newPaid, 0)

      // Update this order
      await Order.findOneAndUpdate(
        { orderID: order.orderID },
        {
          $set: {
            amountSettled:          newPaid,
            'payment.amountPaid':   newPaid,
            'payment.amountDue':    newDue,
            'payment.method':       method,
            'payment.paidAt':       new Date(),
            'payment.gpayRef':      gpayRef || '',
            'payment.notes':        notes   || '',
          },
          $push: {
            'payment.history': {
              method,
              amount:        payThis,
              paidAt:        new Date(),
              notes:         notes || '',
              cashBreakdown: cashBreakdown || {},
            }
          }
        }
      )

      breakdown.push({
        orderID:   order.orderID,
        clothType: order.clothType,
        paid:      payThis,
        remaining: newDue,
      })
    }

    const totalChange = Math.max(parseFloat(amount) - (parseFloat(amount) - remaining), 0)

    res.json({
      success: true,
      message: `Payment of ₹${amount} distributed across ${breakdown.length} order(s)`,
      breakdown,
      change:  remaining, // excess amount to return to customer
    })
  } catch (e) {
    console.error('[BULK PAY]', e.message)
    res.status(500).json({ success:false, message:e.message })
  }
})

module.exports = router
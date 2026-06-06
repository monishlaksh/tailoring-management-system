const express  = require('express')
const Customer = require('../models/Customer')
const { protect, protectAdminOrEmployee } = require('../middleware/auth')
const router   = express.Router()

const getNextCustomerID = async () => {
  const last = await Customer.findOne()
    .sort({ customerID: -1 })
    .select('customerID')
    .lean()
  if (!last || !last.customerID) return 'CUST000001'
  const num  = parseInt(last.customerID.replace('CUST', ''), 10)
  const next = isNaN(num) ? 1 : num + 1
  let newID  = `CUST${String(next).padStart(6, '0')}`
  let exists = await Customer.findOne({ customerID: newID }).lean()
  let counter = next
  while (exists) {
    counter++
    newID  = `CUST${String(counter).padStart(6, '0')}`
    exists = await Customer.findOne({ customerID: newID }).lean()
  }
  return newID
}

// ── Payment summary — MUST be before /:customerID ───────────
router.get('/stats/payment-summary', protect, async (req, res) => {
  try {
    const customers = await Customer.find({ isActive: true })
      .select('customerID name payment')
      .lean()

    let totalCost    = 0
    let totalSettled = 0
    let totalBalance = 0
    const customersWithDue = []

    customers.forEach(c => {
      const p = c.payment || {}
      totalCost    += p.totalCost     || 0
      totalSettled += p.amountSettled || 0
      totalBalance += p.balance       || 0
      if ((p.balance || 0) > 0) {
        customersWithDue.push({
          customerID: c.customerID,
          name:       c.name,
          balance:    p.balance,
          totalCost:  p.totalCost,
          settled:    p.amountSettled,
        })
      }
    })

    res.json({
      success: true,
      summary: {
        totalCost,
        totalSettled,
        totalBalance,
        customersWithDue,
        customersWithDueCount: customersWithDue.length,
      },
    })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── GET all customers ────────────────────────────────────────
router.get('/', protectAdminOrEmployee, async (req, res) => {
  try {
    const { search } = req.query
    let query = { isActive: true }
    if (search) {
      query.$or = [
        { name:       { $regex: search, $options: 'i' } },
        { phone:      { $regex: search, $options: 'i' } },
        { customerID: { $regex: search, $options: 'i' } },
      ]
    }
    const customers = await Customer.find(query).sort({ createdAt: -1 })
    res.json({ success: true, count: customers.length, customers })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── GET single customer ──────────────────────────────────────
router.get('/:customerID', protectAdminOrEmployee, async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerID: req.params.customerID })
    if (!customer)
      return res.status(404).json({ success: false, message: 'Customer not found' })
    res.json({ success: true, customer })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── POST create customer ─────────────────────────────────────
router.post('/', protectAdminOrEmployee, async (req, res) => {
  try {
    const { name, phone, address, notes } = req.body
    if (!name || !phone)
      return res.status(400).json({ success: false, message: 'Name and phone required' })

    const existing = await Customer.findOne({ phone, isActive: true })
    if (existing)
      return res.status(400).json({ success: false, message: 'Phone number already exists' })

    const customerID = await getNextCustomerID()
    const customer   = await Customer.create({ customerID, name, phone, address, notes })
    res.status(201).json({ success: true, message: 'Customer created', customer })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── PUT update customer — admin only ─────────────────────────
router.put('/:customerID', protect, async (req, res) => {
  try {
    const { name, phone, address, notes } = req.body
    const customer = await Customer.findOneAndUpdate(
      { customerID: req.params.customerID },
      { name, phone, address, notes },
      { new: true, runValidators: true }
    )
    if (!customer)
      return res.status(404).json({ success: false, message: 'Customer not found' })
    res.json({ success: true, message: 'Customer updated', customer })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── PATCH payment — admin only ───────────────────────────────
router.patch('/:customerID/payment', protect, async (req, res) => {
  try {
    const { totalCost, amountSettled } = req.body
    if (totalCost === undefined || amountSettled === undefined)
      return res.status(400).json({ success: false, message: 'totalCost and amountSettled required' })

    const total   = parseFloat(totalCost)     || 0
    const settled = parseFloat(amountSettled) || 0

    if (settled > total)
      return res.status(400).json({ success: false, message: 'Settled cannot exceed total cost' })

    const balance  = total - settled
    const customer = await Customer.findOneAndUpdate(
      { customerID: req.params.customerID },
      {
        $set: {
          'payment.totalCost':     total,
          'payment.amountSettled': settled,
          'payment.balance':       balance,
        },
      },
      { new: true }
    )
    if (!customer)
      return res.status(404).json({ success: false, message: 'Customer not found' })

    res.json({ success: true, message: 'Payment updated', customer })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── DELETE customer — admin only ─────────────────────────────
router.delete('/:customerID', protect, async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { customerID: req.params.customerID },
      { isActive: false },
      { new: true }
    )
    if (!customer)
      return res.status(404).json({ success: false, message: 'Customer not found' })
    res.json({ success: true, message: 'Customer deleted' })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

module.exports = router
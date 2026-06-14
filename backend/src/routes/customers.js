const express  = require('express')
const Customer = require('../models/Customer')
const Order    = require('../models/Order')
const { protect, protectAdminOrEmployee, protectAdminOrFullAccess, protectCustomer } = require('../middleware/auth')
const router   = express.Router()

const getNextCustomerID = async () => {
  const last = await Customer.findOne().sort({ customerID:-1 }).select('customerID').lean()
  if (!last || !last.customerID) return 'CUST000001'
  const num  = parseInt(last.customerID.replace('CUST',''), 10)
  const next = isNaN(num) ? 1 : num + 1
  let newID  = `CUST${String(next).padStart(6,'0')}`
  let exists = await Customer.findOne({ customerID: newID }).lean()
  let counter = next
  while (exists) {
    counter++
    newID  = `CUST${String(counter).padStart(6,'0')}`
    exists = await Customer.findOne({ customerID: newID }).lean()
  }
  return newID
}

// Payment summary — before /:customerID
router.get('/stats/payment-summary', protect, async (req, res) => {
  try {
    const customers = await Customer.find({ isActive:true }).lean()
    let totalCostAll = 0, totalSettledAll = 0, totalPending = 0
    const customersWithDue = []
    for (const c of customers) {
      const orders       = await Order.find({ customerID:c.customerID }).lean()
      const totalCost    = orders.reduce((s,o) => s+(o.unitCost      ||0), 0)
      const totalSettled = orders.reduce((s,o) => s+(o.amountSettled ||0), 0)
      const balance      = totalCost - totalSettled
      totalCostAll    += totalCost
      totalSettledAll += totalSettled
      totalPending    += Math.max(balance, 0)
      if (balance > 0) {
        customersWithDue.push({ customerID:c.customerID, name:c.name, totalCost, settled:totalSettled, balance:Math.max(balance,0) })
      }
    }
    res.json({ success:true, summary:{ totalCostAll, totalSettledAll, totalBalance:totalPending, customersWithDue, customersWithDueCount:customersWithDue.length } })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// GET all — admin only
router.get('/', protect, async (req, res) => {
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

// GET single — admin only
router.get('/:customerID', protect, async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerID:req.params.customerID })
    if (!customer)
      return res.status(404).json({ success:false, message:'Customer not found' })
    res.json({ success:true, customer })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST create — ADMIN ONLY
router.post('/',protectAdminOrFullAccess, async (req, res) => {
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
router.put('/:customerID',   protectAdminOrFullAccess, async (req, res) => {
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
      return res.status(400).json({ success:false, message:`Settled cannot exceed total ₹${total}` })
    const customer = await Customer.findOneAndUpdate(
      { customerID:req.params.customerID },
      { amountSettled:settled },
      { new:true }
    )
    if (!customer)
      return res.status(404).json({ success:false, message:'Customer not found' })
    res.json({ success:true, message:'Payment updated', payment:{ totalCost:total, amountSettled:settled, balance:total-settled } })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// GET payment detail
router.get('/:customerID/payment', protect, async (req, res) => {
  try {
    const orders       = await Order.find({ customerID:req.params.customerID }).lean()
    const totalCost    = orders.reduce((s,o) => s+(o.unitCost      ||0), 0)
    const totalSettled = orders.reduce((s,o) => s+(o.amountSettled ||0), 0)
    const orderBreakdown = orders.map(o => ({
      orderID:o.orderID, clothType:o.clothType, quantity:o.quantity,
      unitCost:o.unitCost||0, amountSettled:o.amountSettled||0,
      balance:(o.unitCost||0)-(o.amountSettled||0),
    }))
    res.json({ success:true, payment:{ totalCost, amountSettled:totalSettled, balance:totalCost-totalSettled }, orderBreakdown })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// DELETE — admin only
router.delete('/:customerID', protectAdminOrFullAccess, async (req, res) => {
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

module.exports = router
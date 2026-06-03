const express  = require('express')
const Customer = require('../models/Customer')
const { protect, protectAdminOrEmployee } = require('../middleware/auth')
const router = express.Router()

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

// ── GET all customers — admin AND employee can search ────────
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

// ── GET single customer — admin and employee ─────────────────
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

// ── POST create customer — admin and employee ────────────────
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

// ── DELETE customer — admin only ──────────────────────────────
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
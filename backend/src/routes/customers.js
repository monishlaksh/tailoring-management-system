const express  = require('express')
const Customer = require('../models/Customer')
const { protect } = require('../middleware/auth')
const router = express.Router()

router.get('/', protect, async (req, res) => {
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
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

router.get('/:customerID', protect, async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerID: req.params.customerID })
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' })
    res.json({ success: true, customer })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

router.post('/', protect, async (req, res) => {
  try {
    const { name, phone, address, notes } = req.body
    if (!name || !phone)
      return res.status(400).json({ success: false, message: 'Name and phone required' })
    const existing = await Customer.findOne({ phone })
    if (existing)
      return res.status(400).json({ success: false, message: 'Phone number already exists' })
    const customer = await Customer.create({ name, phone, address, notes })
    res.status(201).json({ success: true, message: 'Customer created', customer })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

router.put('/:customerID', protect, async (req, res) => {
  try {
    const { name, phone, address, notes } = req.body
    const customer = await Customer.findOneAndUpdate(
      { customerID: req.params.customerID },
      { name, phone, address, notes },
      { new: true, runValidators: true }
    )
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' })
    res.json({ success: true, message: 'Customer updated', customer })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

router.delete('/:customerID', protect, async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { customerID: req.params.customerID },
      { isActive: false },
      { new: true }
    )
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' })
    res.json({ success: true, message: 'Customer deleted' })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

module.exports = router
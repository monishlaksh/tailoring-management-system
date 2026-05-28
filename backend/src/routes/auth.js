const express  = require('express')
const jwt      = require('jsonwebtoken')
const Customer = require('../models/Customer')
const { protect } = require('../middleware/auth')

const router = express.Router()

// Admin login
router.post('/admin/login', (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Provide username and password' })
    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD)
      return res.status(401).json({ success: false, message: 'Invalid username or password' })
    const token = jwt.sign({ username, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ success: true, token, admin: { username, role: 'admin' } })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// Admin verify
router.get('/admin/verify', protect, (req, res) => {
  res.json({ success: true, admin: req.admin })
})

// Customer login
router.post('/customer/login', async (req, res) => {
  try {
    const { customerID, phone } = req.body
    if (!customerID || !phone)
      return res.status(400).json({ success: false, message: 'Provide Customer ID and Phone' })
    const customer = await Customer.findOne({
      customerID: customerID.trim().toUpperCase(),
      phone: phone.trim(),
      isActive: true,
    })
    if (!customer)
      return res.status(401).json({ success: false, message: 'Invalid Customer ID or Phone number' })
    const token = jwt.sign(
      { customerID: customer.customerID, customerId: customer._id, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({
      success: true, token,
      customer: {
        customerID: customer.customerID,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
      },
    })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

module.exports = router
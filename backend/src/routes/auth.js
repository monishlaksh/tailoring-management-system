const express  = require('express')
const jwt      = require('jsonwebtoken')
const bcrypt   = require('bcryptjs')
const Customer = require('../models/Customer')
const Employee = require('../models/Employee')
const { protect } = require('../middleware/auth')
const router   = express.Router()

// ── Admin login ──────────────────────────────────────────────
router.post('/admin/login', (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Provide username and password' })
    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD)
      return res.status(401).json({ success: false, message: 'Invalid username or password' })
    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ success: true, token, admin: { username, role: 'admin' } })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── Admin verify ─────────────────────────────────────────────
router.get('/admin/verify', protect, (req, res) => {
  res.json({ success: true, admin: req.admin })
})

// ── Employee login ───────────────────────────────────────────
router.post('/employee/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Provide username and password' })

    const employee = await Employee.findOne({
      username: username.trim(),
      isActive: true,
    })
    if (!employee)
      return res.status(401).json({ success: false, message: 'Invalid username or password' })

    const match = await bcrypt.compare(password, employee.password)
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid username or password' })

    const token = jwt.sign(
      {
        employeeId: employee._id.toString(),
        employeeID: employee.employeeID,
        name:       employee.name,
        role:       'employee',
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      token,
      employee: {
        employeeID: employee.employeeID,
        name:       employee.name,
        username:   employee.username,
        role:       'employee',
      },
    })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── Customer login ───────────────────────────────────────────
router.post('/customer/login', async (req, res) => {
  try {
    const { customerID, phone } = req.body
    if (!customerID || !phone)
      return res.status(400).json({ success: false, message: 'Provide Customer ID and Phone' })

    const customer = await Customer.findOne({
      customerID: customerID.trim().toUpperCase(),
      phone:      phone.trim(),
      isActive:   true,
    })
    if (!customer)
      return res.status(401).json({ success: false, message: 'Invalid Customer ID or Phone number' })

    const token = jwt.sign(
      {
        customerID: customer.customerID,
        customerId: customer._id,
        role:       'customer',
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      token,
      customer: {
        customerID: customer.customerID,
        name:       customer.name,
        phone:      customer.phone,
      },
    })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── Customer: get fresh profile from server ──────────────────
// Uses token to identify customer — always returns latest data
router.get('/customer/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'No token' })

    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role !== 'customer')
      return res.status(403).json({ success: false, message: 'Not a customer token' })

    const customer = await Customer.findOne({
      customerID: decoded.customerID,
      isActive:   true,
    })

    if (!customer)
      return res.status(404).json({ success: false, message: 'Customer not found' })

    res.json({
      success: true,
      customer: {
        customerID:    customer.customerID,
        name:          customer.name,
        phone:         customer.phone,
        address:       customer.address,
        payment:       customer.payment || { totalCost: 0, amountSettled: 0, balance: 0 },
      },
    })
  } catch (e) {
    res.status(401).json({ success: false, message: 'Token invalid or expired' })
  }
})

module.exports = router
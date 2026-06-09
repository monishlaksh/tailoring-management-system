const express       = require('express')
const jwt           = require('jsonwebtoken')
const bcrypt        = require('bcryptjs')
const { OAuth2Client } = require('google-auth-library')
const Customer      = require('../models/Customer')
const Employee      = require('../models/Employee')
const Order         = require('../models/Order')
const { protect }   = require('../middleware/auth')

const router       = express.Router()
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// ── Admin login with username/password (kept as fallback) ────
router.post('/admin/login', (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password)
      return res.status(400).json({ success:false, message:'Provide username and password' })
    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD)
      return res.status(401).json({ success:false, message:'Invalid username or password' })
    const token = jwt.sign(
      { username, role:'admin' },
      process.env.JWT_SECRET,
      { expiresIn:'7d' }
    )
    res.json({ success:true, token, admin:{ username, role:'admin' } })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// ── Admin login with Google ──────────────────────────────────
router.post('/admin/google', async (req, res) => {
  try {
    const { credential } = req.body
    if (!credential)
      return res.status(400).json({ success:false, message:'No Google credential provided' })

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken:  credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    const email   = payload.email
    const name    = payload.name

    // Check if this email is allowed as admin
    const allowedEmails = (process.env.ALLOWED_ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())

    if (!allowedEmails.includes(email.toLowerCase())) {
      return res.status(403).json({
        success:  false,
        message:  `Access denied. ${email} is not an authorized admin account.`,
      })
    }

    // Generate JWT
    const token = jwt.sign(
      { username: name, email, role:'admin' },
      process.env.JWT_SECRET,
      { expiresIn:'7d' }
    )

    res.json({
      success: true,
      token,
      admin: { username: name, email, role:'admin' },
    })
  } catch (e) {
    res.status(401).json({
      success:  false,
      message:  'Google login failed. Please try again.',
      error:    e.message,
    })
  }
})

// ── Admin verify ─────────────────────────────────────────────
router.get('/admin/verify', protect, (req, res) => {
  res.json({ success:true, admin:req.admin })
})

// ── Employee login ───────────────────────────────────────────
router.post('/employee/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password)
      return res.status(400).json({ success:false, message:'Provide username and password' })

    const employee = await Employee.findOne({ username: username.trim(), isActive:true })
    if (!employee)
      return res.status(401).json({ success:false, message:'Invalid username or password' })

    const match = await bcrypt.compare(password, employee.password)
    if (!match)
      return res.status(401).json({ success:false, message:'Invalid username or password' })

    const token = jwt.sign(
      { employeeId:employee._id.toString(), employeeID:employee.employeeID, name:employee.name, role:'employee' },
      process.env.JWT_SECRET,
      { expiresIn:'7d' }
    )
    res.json({
      success:  true,
      token,
      employee: { employeeID:employee.employeeID, name:employee.name, username:employee.username, role:'employee' },
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// ── Customer login ───────────────────────────────────────────
router.post('/customer/login', async (req, res) => {
  try {
    const { customerID, phone } = req.body
    if (!customerID || !phone)
      return res.status(400).json({ success:false, message:'Provide Customer ID and Phone' })

    const customer = await Customer.findOne({
      customerID: customerID.trim().toUpperCase(),
      phone:      phone.trim(),
      isActive:   true,
    })
    if (!customer)
      return res.status(401).json({ success:false, message:'Invalid Customer ID or Phone number' })

    const token = jwt.sign(
      { customerID:customer.customerID, customerId:customer._id, role:'customer' },
      process.env.JWT_SECRET,
      { expiresIn:'7d' }
    )
    res.json({
      success:  true,
      token,
      customer: { customerID:customer.customerID, name:customer.name, phone:customer.phone },
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// ── Customer: get fresh profile ──────────────────────────────
router.get('/customer/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success:false, message:'No token' })

    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role !== 'customer')
      return res.status(403).json({ success:false, message:'Not a customer token' })

    const customer = await Customer.findOne({ customerID:decoded.customerID, isActive:true })
    if (!customer)
      return res.status(404).json({ success:false, message:'Customer not found' })

    const orders       = await Order.find({ customerID:decoded.customerID }).lean()
    const totalCost    = orders.reduce((sum,o) => sum + (o.unitCost      || 0), 0)
    const totalSettled = orders.reduce((sum,o) => sum + (o.amountSettled || 0), 0)
    const balance      = Math.max(totalCost - totalSettled, 0)

    res.json({
      success:  true,
      customer: {
        customerID: customer.customerID,
        name:       customer.name,
        phone:      customer.phone,
        address:    customer.address,
        payment:    { totalCost, amountSettled:totalSettled, balance },
      },
    })
  } catch (e) {
    res.status(401).json({ success:false, message:'Token invalid or expired' })
  }
})

module.exports = router
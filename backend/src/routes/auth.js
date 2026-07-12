const express    = require('express')
const jwt        = require('jsonwebtoken')
const bcrypt     = require('bcryptjs')
const { OAuth2Client } = require('google-auth-library')
const Customer   = require('../models/Customer')
const Employee   = require('../models/Employee')
const Order      = require('../models/Order')         // ← TOP LEVEL
const { protect } = require('../middleware/auth')

const router       = express.Router()
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const router       = express.Router()
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// ── Admin login ──────────────────────────────────────────────
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password)
      return res.status(400).json({ success:false, message:'Provide username and password' })

    let passwordValid = false

    if (global.adminNewPassword) {
      const usernameMatch =
        username === process.env.ADMIN_USERNAME ||
        username.toLowerCase() === global.adminNewPassword.email.toLowerCase()
      const passwordMatch = await bcrypt.compare(password, global.adminNewPassword.hash)
      passwordValid = usernameMatch && passwordMatch
    }

    if (!passwordValid) {
      passwordValid =
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
    }

    if (!passwordValid)
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

// ── Admin Google login ───────────────────────────────────────
router.post('/admin/google', async (req, res) => {
  try {
    const { credential } = req.body
    if (!credential)
      return res.status(400).json({ success:false, message:'No Google credential provided' })

    const ticket  = await googleClient.verifyIdToken({
      idToken:  credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    const payload = ticket.getPayload()
    const email   = payload.email
    const name    = payload.name

    const allowedEmails = (process.env.ALLOWED_ADMIN_EMAILS || '')
      .split(',').map(e => e.trim().toLowerCase())

    if (!allowedEmails.includes(email.toLowerCase()))
      return res.status(403).json({
        success:false,
        message:`Access denied. ${email} is not authorized.`,
      })

    const token = jwt.sign(
      { username:name, email, role:'admin' },
      process.env.JWT_SECRET,
      { expiresIn:'7d' }
    )
    res.json({ success:true, token, admin:{ username:name, email, role:'admin' } })
  } catch (e) {
    res.status(401).json({ success:false, message:'Google login failed.', error:e.message })
  }
})

// ── Admin verify ─────────────────────────────────────────────
router.get('/admin/verify', protect, (req, res) => {
  res.json({ success:true, admin:req.admin })
})

// ── Employee login ───────────────────────────────────────────
// CRITICAL: hasFullAccess and employeeRole MUST be in the response
router.post('/employee/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password)
      return res.status(400).json({ success:false, message:'Provide username and password' })

    const employee = await Employee.findOne({
      username: username.trim(),
      isActive: true,
    })
    if (!employee)
      return res.status(401).json({ success:false, message:'Invalid username or password' })

    const match = await bcrypt.compare(password, employee.password)
    if (!match)
      return res.status(401).json({ success:false, message:'Invalid username or password' })

    // Safely handle accessRole — default to 'employee' if not set
    const accessRole    = employee.accessRole || 'employee'
    const hasFullAccess = employee.hasFullAccess === true || accessRole === 'manager'

    const token = jwt.sign(
      {
        employeeId:    employee._id.toString(),
        employeeID:    employee.employeeID,
        name:          employee.name,
        role:          'employee',
        employeeRole:  employee.role          || 'all',
        accessRole,
        hasFullAccess,
      },
      process.env.JWT_SECRET,
      { expiresIn:'7d' }
    )

    res.json({
      success:  true,
      token,
      employee: {
        employeeID:    employee.employeeID,
        name:          employee.name,
        username:      employee.username,
        role:          'employee',
        employeeRole:  employee.role          || 'all',
        accessRole,
        hasFullAccess,
      },
    })
  } catch (e) {
    console.error('[EMP LOGIN]', e.message)
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
      {
        customerID: customer.customerID,
        customerId: customer._id,
        role:       'customer',
      },
      process.env.JWT_SECRET,
      { expiresIn:'7d' }
    )

    res.json({
      success:  true,
      token,
      customer: {
        customerID: customer.customerID,
        name:       customer.name,
        phone:      customer.phone,
      },
    })
  } catch (e) {
    console.error('[CUST LOGIN]', e.message)
    res.status(500).json({ success:false, message:e.message })
  }
})

// ── Customer: get fresh profile ──────────────────────────────
router.get('/customer/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer '))
      return res.status(401).json({ success:false, message:'No token' })

    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role !== 'customer')
      return res.status(403).json({ success:false, message:'Not a customer token' })

    const customer = await Customer.findOne({
      customerID: decoded.customerID,
      isActive:   true,
    }).lean()

    if (!customer)
      return res.status(404).json({ success:false, message:'Customer not found' })

    // Order is already imported at top — no require() needed
    const orders       = await Order.find({ customerID:decoded.customerID }).lean()
    const totalCost    = orders.reduce((s,o) => s+(o.unitCost||0), 0)
    const totalSettled = orders.reduce((s,o) => s+(o.amountSettled||0), 0)

    res.json({
      success:  true,
      customer: {
        customerID: customer.customerID,
        name:       customer.name,
        phone:      customer.phone,
        address:    customer.address || '',
        payment: {
          totalCost,
          amountSettled: totalSettled,
          balance:       Math.max(totalCost-totalSettled, 0),
        },
      },
    })
  } catch (e) {
    console.error('[CUSTOMER/ME]', e.message)
    if (e.name==='JsonWebTokenError'||e.name==='TokenExpiredError') {
      return res.status(401).json({ success:false, message:'Token invalid or expired' })
    }
    res.status(500).json({ success:false, message:e.message })
  }
})

// ── Admin forgot password ────────────────────────────────────
router.post('/admin/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email)
      return res.status(400).json({ success:false, message:'Email is required' })

    const allowedEmails = (process.env.ALLOWED_ADMIN_EMAILS || '')
      .split(',').map(e => e.trim().toLowerCase())

    if (!allowedEmails.includes(email.toLowerCase()))
      return res.status(404).json({ success:false, message:'Email not found in admin list' })

    const resetCode   = Math.floor(100000 + Math.random() * 900000).toString()
    const resetExpiry = Date.now() + 15 * 60 * 1000

    global.adminResetCodes = global.adminResetCodes || {}
    global.adminResetCodes[email.toLowerCase()] = { code:resetCode, expiry:resetExpiry }

    const { Resend } = require('resend')
    const resend     = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from:    'Al-Ameen Tailors <onboarding@resend.dev>',
      to:      email,
      subject: 'Admin Password Reset Code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8f7ff;border-radius:12px;">
          <h2 style="color:#4F46E5;">Al-Ameen Tailors</h2>
          <p>Your password reset code:</p>
          <div style="background:#4F46E5;color:white;font-size:2.5rem;font-weight:800;letter-spacing:8px;text-align:center;padding:20px;border-radius:10px;margin:20px 0;">
            ${resetCode}
          </div>
          <p style="color:#6B7280;">Expires in 15 minutes.</p>
        </div>
      `,
    })
    res.json({ success:true, message:'Reset code sent to your email' })
  } catch (e) {
    res.status(500).json({ success:false, message:'Failed to send email: '+e.message })
  }
})

// ── Admin reset password ─────────────────────────────────────
router.post('/admin/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body
    if (!email || !code || !newPassword)
      return res.status(400).json({ success:false, message:'Email, code and new password required' })

    global.adminResetCodes = global.adminResetCodes || {}
    const stored = global.adminResetCodes[email.toLowerCase()]

    if (!stored)
      return res.status(400).json({ success:false, message:'No reset code found. Request a new one.' })
    if (Date.now() > stored.expiry)
      return res.status(400).json({ success:false, message:'Code expired. Request a new one.' })
    if (stored.code !== code.trim())
      return res.status(400).json({ success:false, message:'Invalid code.' })

    const hashed = await bcrypt.hash(newPassword, 10)
    global.adminNewPassword = { email:email.toLowerCase(), hash:hashed }
    delete global.adminResetCodes[email.toLowerCase()]

    res.json({ success:true, message:'Password updated! You can now login.' })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

module.exports = router
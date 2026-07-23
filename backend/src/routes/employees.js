const express   = require('express')
const bcrypt    = require('bcryptjs')
const Employee  = require('../models/Employee')
const Allotment = require('../models/Allotment')
const {
  protect,
  protectAdminOrFullAccess,
} = require('../middleware/auth')

const router = express.Router()

// ── Static routes FIRST (before /:employeeID) ────────────────

// One-time migration — set accessRole for existing employees
router.post('/migrate-roles', protect, async (req, res) => {
  try {
    const result = await Employee.updateMany(
      { accessRole: { $exists: false } },
      { $set: { accessRole: 'employee' } }
    )
    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} employees`,
    })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// One-time migration — set plainPassword field
router.post('/migrate-passwords', protect, async (req, res) => {
  try {
    const result = await Employee.updateMany(
      { plainPassword: { $exists: false } },
      { $set: { plainPassword: '' } }
    )
    res.json({
      success: true,
      message: `Migrated ${result.modifiedCount} employees`,
    })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// GET employees by role
router.get('/by-role/:role', protect, async (req, res) => {
  try {
    const { role } = req.params
    const validRoles = ['cutting', 'stitching', 'finishing', 'all']
    if (!validRoles.includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role' })
    const employees = await Employee.find({
      isActive: true,
      $or: [{ role }, { role: 'all' }],
    }).select('-password').lean()
    res.json({ success: true, employees })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── GET all employees ─────────────────────────────────────────
router.get('/', protectAdminOrFullAccess, async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true })
      .select('-password')
      .lean()
    res.json({ success: true, employees })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── POST create employee ──────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const {
      name, username, password, phone,
      role, accessRole, bonus,
    } = req.body

    if (!name || !username || !password)
      return res.status(400).json({
        success: false,
        message: 'Name, username and password required',
      })

    const exists = await Employee.findOne({ username: username.trim() })
    if (exists)
      return res.status(400).json({
        success: false,
        message: 'Username already taken',
      })

    const validRoles = ['cutting', 'stitching', 'finishing', 'all']
    const empRole    = validRoles.includes(role) ? role : 'all'

    const validAccessRoles = ['employee', 'receptionist', 'manager']
    const empAccessRole    = validAccessRoles.includes(accessRole)
      ? accessRole : 'employee'

    const hashed = await bcrypt.hash(password.trim(), 10)

    // Generate employeeID
    const last = await Employee.findOne()
      .sort({ createdAt: -1 })
      .select('employeeID')
      .lean()
    let nextNum = 1
    if (last?.employeeID) {
      const n = parseInt(last.employeeID.replace('EMP', ''), 10)
      if (!isNaN(n)) nextNum = n + 1
    }
    const employeeID = `EMP${String(nextNum).padStart(6, '0')}`

    const employee = await Employee.create({
      employeeID,
      name:          name.trim(),
      username:      username.trim(),
      password:      hashed,
      plainPassword: password.trim(),
      phone:         phone        || '',
      role:          empRole,
      accessRole:    empAccessRole,
      hasFullAccess: empAccessRole === 'manager',
      bonus:         Number(bonus) || 0,
      isActive:      true,
    })

    const obj = employee.toObject()
    delete obj.password
    res.status(201).json({ success: true, employee: obj })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// ── Dynamic routes — employeeID param ────────────────────────

// GET single employee by employeeID string (e.g. EMP000001)
router.get('/:employeeID', protect, async (req, res) => {
  try {
    const employee = await Employee.findOne({
      employeeID: req.params.employeeID,
    })
      .select('-password')
      .lean()

    if (!employee)
      return res.status(404).json({ success: false, message: 'Employee not found' })

    res.json({ success: true, employee })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// GET employee current password
router.get('/:employeeID/password', protect, async (req, res) => {
  try {
    const employee = await Employee.findOne({
      employeeID: req.params.employeeID,
    }).lean()

    if (!employee)
      return res.status(404).json({ success: false, message: 'Not found' })

    res.json({
      success:  true,
      password: employee.plainPassword || null,
    })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// GET employee stats
router.get('/:employeeID/stats', protect, async (req, res) => {
  try {
    const { employeeID } = req.params

    const allotments = await Allotment.find({
      $or: [
        { 'cutting.employeeID':   employeeID },
        { 'stitching.employeeID': employeeID },
        { 'finishing.employeeID': employeeID },
      ],
    }).lean()

    let totalCompleted   = 0
    let totalAwarded     = 0
    const stageBreakdown = { cutting: 0, stitching: 0, finishing: 0 }
    const awardBreakdown = { cutting: 0, stitching: 0, finishing: 0 }

    allotments.forEach(a => {
      ;['cutting', 'stitching', 'finishing'].forEach(stage => {
        if (
          a[stage]?.employeeID === employeeID &&
          a[stage]?.status     === 'completed' &&
          a[stage]?.adminApproved
        ) {
          totalCompleted++
          totalAwarded += a[stage].award || 0
          stageBreakdown[stage]++
          awardBreakdown[stage] += a[stage].award || 0
        }
      })
    })

    res.json({
      success: true,
      stats: { totalCompleted, totalAwarded, stageBreakdown, awardBreakdown },
    })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// PUT update employee
router.put('/:employeeID', protect, async (req, res) => {
  try {
    const { name, username, password, isActive, role, accessRole, bonus } = req.body

    const employee = await Employee.findOne({
      employeeID: req.params.employeeID,
    })
    if (!employee)
      return res.status(404).json({ success: false, message: 'Employee not found' })

    if (name)                          employee.name     = name.trim()
    if (username)                      employee.username = username.trim()
    if (typeof isActive === 'boolean') employee.isActive = isActive

    const validRoles = ['cutting', 'stitching', 'finishing', 'all']
    if (role && validRoles.includes(role)) employee.role = role

    const validAccessRoles = ['employee', 'receptionist', 'manager']
    if (accessRole && validAccessRoles.includes(accessRole)) {
      employee.accessRole    = accessRole
      employee.hasFullAccess = accessRole === 'manager'
    }

    if (bonus !== undefined) employee.bonus = Number(bonus) || 0

    if (password && password.trim() !== '') {
      employee.password      = await bcrypt.hash(password.trim(), 10)
      employee.plainPassword = password.trim()
    }

    await employee.save()

    const obj = employee.toObject()
    delete obj.password
    res.json({ success: true, message: 'Employee updated', employee: obj })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// PATCH update password
router.patch('/:employeeID/password', protect, async (req, res) => {
  try {
    const { password } = req.body
    if (!password || password.trim().length < 4)
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 4 characters',
      })

    const hashed   = await bcrypt.hash(password.trim(), 10)
    const employee = await Employee.findOneAndUpdate(
      { employeeID: req.params.employeeID },
      { $set: { password: hashed, plainPassword: password.trim() } },
      { new: true }
    ).select('-password').lean()

    if (!employee)
      return res.status(404).json({ success: false, message: 'Employee not found' })

    res.json({ success: true, message: 'Password updated', employee })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// PATCH set bonus
router.patch('/:employeeID/bonus', protect, async (req, res) => {
  try {
    const { bonus } = req.body
    if (bonus === undefined || bonus < 0)
      return res.status(400).json({
        success: false,
        message: 'Valid bonus amount required',
      })

    const employee = await Employee.findOneAndUpdate(
      { employeeID: req.params.employeeID },
      { bonus: parseFloat(bonus) || 0 },
      { new: true }
    ).select('-password').lean()

    if (!employee)
      return res.status(404).json({ success: false, message: 'Employee not found' })

    res.json({ success: true, message: 'Bonus updated', employee })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// PATCH grant/revoke full access
router.patch('/:employeeID/access', protect, async (req, res) => {
  try {
    const { hasFullAccess } = req.body
    if (typeof hasFullAccess !== 'boolean')
      return res.status(400).json({
        success: false,
        message: 'hasFullAccess must be boolean',
      })

    const employee = await Employee.findOneAndUpdate(
      { employeeID: req.params.employeeID },
      { hasFullAccess },
      { new: true }
    ).select('-password').lean()

    if (!employee)
      return res.status(404).json({ success: false, message: 'Employee not found' })

    res.json({
      success:  true,
      message:  hasFullAccess
        ? `Full access granted to ${employee.name}`
        : `Full access revoked from ${employee.name}`,
      employee,
    })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// DELETE employee (soft delete)
router.delete('/:employeeID', protect, async (req, res) => {
  try {
    const employee = await Employee.findOneAndUpdate(
      { employeeID: req.params.employeeID },
      { isActive: false },
      { new: true }
    )
    if (!employee)
      return res.status(404).json({ success: false, message: 'Employee not found' })
    res.json({ success: true, message: 'Employee deactivated' })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

module.exports = router
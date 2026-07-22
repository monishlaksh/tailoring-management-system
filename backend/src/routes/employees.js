const express  = require('express')
const bcrypt   = require('bcryptjs')
const Employee = require('../models/Employee')
const Allotment = require('../models/Allotment')
const { protect, protectAdminOrEmployee, protectAdminOrFullAccess } = require('../middleware/auth')
const router = express.Router()

const getNextEmployeeID = async () => {
  const last = await Employee.findOne()
    .sort({ employeeID:-1 }).select('employeeID').lean()
  if (!last || !last.employeeID) return 'EMP000001'
  const num  = parseInt(last.employeeID.replace('EMP',''), 10)
  const next = isNaN(num) ? 1 : num + 1
  let newID  = `EMP${String(next).padStart(6,'0')}`
  let exists = await Employee.findOne({ employeeID:newID }).lean()
  let counter = next
  while (exists) {
    counter++
    newID  = `EMP${String(counter).padStart(6,'0')}`
    exists = await Employee.findOne({ employeeID:newID }).lean()
  }
  return newID
}

// GET all employees — allow manager/receptionist to view
// GET all employees
router.get('/', protectAdminOrFullAccess, async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true })
      .select('-password') // only remove hashed password, keep plainPassword
      .lean()
    res.json({ success: true, employees })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// GET single employee
router.get('/:id', protect, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .select('-password')
      .lean()
    if (!employee)
      return res.status(404).json({ success: false, message: 'Not found' })
    res.json({ success: true, employee })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})
// PATCH update password
router.patch('/:id/password', protect, async (req, res) => {
  try {
    const { password } = req.body
    if (!password || password.trim().length < 4)
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 4 characters',
      })

    const hashed = await bcrypt.hash(password.trim(), 10)

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          password:      hashed,
          plainPassword: password.trim(), // ← save plain text too
        },
      },
      { new: true }
    ).select('-password').lean()

    if (!employee)
      return res.status(404).json({ success: false, message: 'Employee not found' })

    res.json({ success: true, message: 'Password updated', employee })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// POST create employee
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

    const hashed = await bcrypt.hash(password.trim(), 10)

    const employee = await Employee.create({
      name:          name.trim(),
      username:      username.trim(),
      password:      hashed,
      plainPassword: password.trim(), // ← always save plain
      phone:         phone            || '',
      role:          role             || 'all',
      accessRole:    accessRole       || 'employee',
      bonus:         bonus            || 0,
      isActive:      true,
    })

    const { password: _, ...emp } = employee.toObject()
    res.status(201).json({ success: true, employee: emp })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})
// One-time migration — mark employees with no plainPassword
router.post('/migrate-passwords', protect, async (req, res) => {
  try {
    // Just mark them so the UI shows the warning correctly
    const result = await Employee.updateMany(
      { plainPassword:{ $exists:false } },
      { $set:{ plainPassword:'' } }
    )
    res.json({
      success: true,
      message: `Migrated ${result.modifiedCount} employees`,
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})
// GET current password — admin only
router.get('/:employeeID/password', protect, async (req, res) => {
  try {
    const employee = await Employee.findOne({ employeeID:req.params.employeeID })
    if (!employee)
      return res.status(404).json({ success:false, message:'Not found' })

    res.json({
      success:  true,
      password: employee.plainPassword || null,
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// GET employee stats — admin only
// Returns completed stages count and total awards per employee
router.get('/:employeeID/stats', protect, async (req, res) => {
  try {
    const { employeeID } = req.params

    // Find all allotments where this employee worked on any stage
    const allotments = await Allotment.find({
      $or: [
        { 'cutting.employeeID':   employeeID },
        { 'stitching.employeeID': employeeID },
        { 'finishing.employeeID': employeeID },
      ]
    }).lean()

    let totalCompleted = 0
    let totalAwarded   = 0
    const stageBreakdown = { cutting:0, stitching:0, finishing:0 }
    const awardBreakdown = { cutting:0, stitching:0, finishing:0 }

    allotments.forEach(a => {
      const stages = ['cutting','stitching','finishing']
      stages.forEach(stage => {
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
      stats: {
        totalCompleted,
        totalAwarded,
        stageBreakdown,
        awardBreakdown,
      },
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// GET employees by role
router.get('/by-role/:role', protect, async (req, res) => {
  try {
    const { role } = req.params
    const validRoles = ['cutting','stitching','finishing','all']
    if (!validRoles.includes(role))
      return res.status(400).json({ success:false, message:'Invalid role' })
    const employees = await Employee.find({
      isActive: true,
      $or: [{ role }, { role:'all' }],
    }).select('-password')
    res.json({ success:true, employees })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST create employee
router.post('/', protect, async (req, res) => {
  try {
    const { name, username, password, role } = req.body
    if (!name || !username || !password)
      return res.status(400).json({ success:false, message:'Name, username and password required' })

    const validRoles = ['cutting','stitching','finishing','all']
    const empRole    = validRoles.includes(role) ? role : 'all'
    const existing   = await Employee.findOne({ username:username.trim() })
    if (existing)
      return res.status(400).json({ success:false, message:'Username already exists' })

    const hashedPassword = await bcrypt.hash(password, 10)
    const employeeID     = await getNextEmployeeID()

    const validAccessRoles = ['employee','receptionist','manager']
    const accessRole = validAccessRoles.includes(req.body.accessRole)
      ? req.body.accessRole : 'employee'

    const employee = await Employee.create({
       employeeID,
        name:          name.trim(),
        username:      username.trim(),
        password:      hashedPassword,
        plainPassword: password,        // ← save plain
        role:          empRole,
        accessRole:    accessRole || 'employee',
        hasFullAccess: (accessRole||'employee') === 'manager',
      })
    res.status(201).json({
      success:  true,
      message:  'Employee created',
      employee: {
        employeeID: employee.employeeID,
        name:       employee.name,
        username:   employee.username,
        role:       employee.role,
        isActive:   employee.isActive,
      },
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// PUT update employee
router.put('/:employeeID', protect, async (req, res) => {
  try {
    const { name, username, password, isActive, role } = req.body
    const employee = await Employee.findOne({ employeeID:req.params.employeeID })
    if (!employee)
      return res.status(404).json({ success:false, message:'Employee not found' })

    if (name)     employee.name     = name.trim()
    if (username) employee.username = username.trim()
    if (typeof isActive === 'boolean') employee.isActive = isActive

    const validRoles = ['cutting','stitching','finishing','all']
    if (role && validRoles.includes(role)) employee.role = role

    if (password && password.trim() !== '') {
  employee.password      = await bcrypt.hash(password, 10)
  employee.plainPassword = password.trim()   // ← update plain
}


    // In PUT update employee route, add:
const validAccessRoles = ['employee','receptionist','manager']
if (req.body.accessRole && validAccessRoles.includes(req.body.accessRole)) {
  employee.accessRole    = req.body.accessRole
  employee.hasFullAccess = req.body.accessRole === 'manager'
}

    await employee.save()
    res.json({
      success:  true,
      message:  'Employee updated',
      employee: {
        employeeID: employee.employeeID,
        name:       employee.name,
        username:   employee.username,
        role:       employee.role,
        isActive:   employee.isActive,
      },
    })


  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// PATCH grant/revoke full access
router.patch('/:employeeID/access', protect, async (req, res) => {
  try {
    const { hasFullAccess } = req.body
    if (typeof hasFullAccess !== 'boolean')
      return res.status(400).json({ success:false, message:'hasFullAccess must be boolean' })

    const employee = await Employee.findOneAndUpdate(
      { employeeID:req.params.employeeID },
      { hasFullAccess },
      { new:true }
    ).select('-password')

    if (!employee)
      return res.status(404).json({ success:false, message:'Employee not found' })

    res.json({
      success:  true,
      message:  hasFullAccess
        ? `Full access granted to ${employee.name}`
        : `Full access revoked from ${employee.name}`,
      employee,
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// DELETE employee (soft)
router.delete('/:employeeID', protect, async (req, res) => {
  try {
    const employee = await Employee.findOneAndUpdate(
      { employeeID:req.params.employeeID },
      { isActive:false },
      { new:true }
    )
    if (!employee)
      return res.status(404).json({ success:false, message:'Employee not found' })
    res.json({ success:true, message:'Employee deactivated' })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})
// PATCH set employee bonus
router.patch('/:employeeID/bonus', protect, async (req, res) => {
  try {
    const { bonus } = req.body
    if (bonus === undefined || bonus < 0)
      return res.status(400).json({ success:false, message:'Valid bonus amount required' })

    const employee = await Employee.findOneAndUpdate(
      { employeeID:req.params.employeeID },
      { bonus: parseFloat(bonus) || 0 },
      { new:true }
    ).select('-password')

    if (!employee)
      return res.status(404).json({ success:false, message:'Employee not found' })

    res.json({
      success:  true,
      message:  bonus > 0
        ? `Bonus ₹${bonus}/order set for ${employee.name}`
        : `Bonus removed for ${employee.name}`,
      employee,
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})
// One-time migration — set accessRole for existing employees
router.post('/migrate-roles', protect, async (req, res) => {
  try {
    const result = await Employee.updateMany(
      { accessRole:{ $exists:false } },
      { $set:{ accessRole:'employee' } }
    )
    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} employees with default accessRole`,
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

module.exports = router
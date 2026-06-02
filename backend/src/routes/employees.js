const express  = require('express')
const bcrypt   = require('bcryptjs')
const Employee = require('../models/Employee')
const { protect } = require('../middleware/auth')
const router = express.Router()

// ── Helper: generate employee ID ────────────────────────────
const getNextEmployeeID = async () => {
  const last = await Employee.findOne().sort({ employeeID: -1 }).select('employeeID').lean()
  if (!last || !last.employeeID) return 'EMP000001'
  const num  = parseInt(last.employeeID.replace('EMP',''), 10)
  const next = isNaN(num) ? 1 : num + 1
  return `EMP${String(next).padStart(6,'0')}`
}

// GET all employees (admin only)
router.get('/', protect, async (req, res) => {
  try {
    const employees = await Employee.find().select('-password').sort({ createdAt: -1 })
    res.json({ success:true, count:employees.length, employees })
  } catch (e) { res.status(500).json({ success:false, message:e.message }) }
})

// POST create employee (admin only)
router.post('/', protect, async (req, res) => {
  try {
    const { name, username, password } = req.body
    if (!name || !username || !password)
      return res.status(400).json({ success:false, message:'Name, username and password required' })

    const existing = await Employee.findOne({ username })
    if (existing)
      return res.status(400).json({ success:false, message:'Username already exists' })

    const employeeID = await getNextEmployeeID()
    const employee   = await Employee.create({ employeeID, name, username, password })

    res.status(201).json({
      success: true,
      message: 'Employee created',
      employee: { employeeID: employee.employeeID, name: employee.name, username: employee.username },
    })
  } catch (e) { res.status(500).json({ success:false, message:e.message }) }
})

// PUT update employee (admin only)
router.put('/:employeeID', protect, async (req, res) => {
  try {
    const { name, username, password, isActive } = req.body
    const employee = await Employee.findOne({ employeeID: req.params.employeeID })
    if (!employee)
      return res.status(404).json({ success:false, message:'Employee not found' })

    if (name)     employee.name     = name
    if (username) employee.username = username
    if (password) employee.password = password  // pre-save hook hashes it
    if (typeof isActive === 'boolean') employee.isActive = isActive

    await employee.save()
    res.json({ success:true, message:'Employee updated' })
  } catch (e) { res.status(500).json({ success:false, message:e.message }) }
})

// DELETE employee (admin only)
router.delete('/:employeeID', protect, async (req, res) => {
  try {
    const employee = await Employee.findOneAndUpdate(
      { employeeID: req.params.employeeID },
      { isActive: false },
      { new: true }
    )
    if (!employee)
      return res.status(404).json({ success:false, message:'Employee not found' })
    res.json({ success:true, message:'Employee deactivated' })
  } catch (e) { res.status(500).json({ success:false, message:e.message }) }
})

module.exports = router
const express  = require('express')
const bcrypt   = require('bcryptjs')
const Employee = require('../models/Employee')
const { protect } = require('../middleware/auth')
const router = express.Router()

const getNextEmployeeID = async () => {
  const last = await Employee.findOne()
    .sort({ employeeID: -1 })
    .select('employeeID')
    .lean()
  if (!last || !last.employeeID) return 'EMP000001'
  const num  = parseInt(last.employeeID.replace('EMP', ''), 10)
  const next = isNaN(num) ? 1 : num + 1
  let newID  = `EMP${String(next).padStart(6, '0')}`
  let exists = await Employee.findOne({ employeeID: newID }).lean()
  let counter = next
  while (exists) {
    counter++
    newID  = `EMP${String(counter).padStart(6, '0')}`
    exists = await Employee.findOne({ employeeID: newID }).lean()
  }
  return newID
}

// GET all employees
router.get('/', protect, async (req, res) => {
  try {
    const employees = await Employee.find()
      .select('-password')
      .sort({ createdAt: -1 })
    res.json({ success: true, count: employees.length, employees })
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

    // Return employees who have this specific role OR have 'all' role
    const employees = await Employee.find({
      isActive: true,
      $or: [{ role }, { role: 'all' }],
    }).select('-password')

    res.json({ success: true, employees })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// POST create employee
router.post('/', protect, async (req, res) => {
  try {
    const { name, username, password, role } = req.body

    if (!name || !username || !password)
      return res.status(400).json({ success: false, message: 'Name, username and password required' })

    const validRoles = ['cutting', 'stitching', 'finishing', 'all']
    const empRole    = validRoles.includes(role) ? role : 'all'

    const existing = await Employee.findOne({ username: username.trim() })
    if (existing)
      return res.status(400).json({ success: false, message: 'Username already exists' })

    const hashedPassword = await bcrypt.hash(password, 10)
    const employeeID     = await getNextEmployeeID()

    const employee = await Employee.create({
      employeeID,
      name:     name.trim(),
      username: username.trim(),
      password: hashedPassword,
      role:     empRole,
    })

    res.status(201).json({
      success: true,
      message: 'Employee created',
      employee: {
        employeeID: employee.employeeID,
        name:       employee.name,
        username:   employee.username,
        role:       employee.role,
        isActive:   employee.isActive,
      },
    })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// PUT update employee
router.put('/:employeeID', protect, async (req, res) => {
  try {
    const { name, username, password, isActive, role } = req.body

    const employee = await Employee.findOne({ employeeID: req.params.employeeID })
    if (!employee)
      return res.status(404).json({ success: false, message: 'Employee not found' })

    if (name)     employee.name     = name.trim()
    if (username) employee.username = username.trim()
    if (typeof isActive === 'boolean') employee.isActive = isActive

    const validRoles = ['cutting', 'stitching', 'finishing', 'all']
    if (role && validRoles.includes(role)) employee.role = role

    if (password && password.trim() !== '') {
      employee.password = await bcrypt.hash(password, 10)
    }

    await employee.save()

    res.json({
      success: true,
      message: 'Employee updated',
      employee: {
        employeeID: employee.employeeID,
        name:       employee.name,
        username:   employee.username,
        role:       employee.role,
        isActive:   employee.isActive,
      },
    })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// DELETE employee (soft)
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
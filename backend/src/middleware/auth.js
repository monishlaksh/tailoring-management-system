const jwt      = require('jsonwebtoken')
const Employee = require('../models/Employee')

// ── Admin only ────────────────────────────────────────────────
const protect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token)
      return res.status(401).json({ success:false, message:'No token provided' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.role !== 'admin')
      return res.status(403).json({ success:false, message:'Admin access required' })
    req.admin = decoded
    req.role  = 'admin'
    next()
  } catch (e) {
    return res.status(401).json({ success:false, message:'Token invalid or expired' })
  }
}

// ── Employee only ─────────────────────────────────────────────
const protectEmployee = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token)
      return res.status(401).json({ success:false, message:'No token provided' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.role !== 'employee')
      return res.status(403).json({ success:false, message:'Employee access required' })

    const employee = await findEmployee(decoded)
    if (!employee)
      return res.status(403).json({ success:false, message:'Employee not found or inactive' })

    req.employee = buildEmployeeReq(employee)
    req.role     = 'employee'
    next()
  } catch (e) {
    return res.status(401).json({ success:false, message:'Token invalid or expired' })
  }
}

// ── Admin OR any employee (read access) ───────────────────────
const protectAdminOrEmployee = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token)
      return res.status(401).json({ success:false, message:'No token provided' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role === 'admin') {
      req.admin = decoded; req.role = 'admin'; return next()
    }

    if (decoded.role === 'employee') {
      const employee = await findEmployee(decoded)
      if (!employee)
        return res.status(403).json({ success:false, message:'Employee not found or inactive' })
      req.employee = buildEmployeeReq(employee)
      req.role     = 'employee'
      return next()
    }

    return res.status(403).json({ success:false, message:'Access denied' })
  } catch (e) {
    return res.status(401).json({ success:false, message:'Token invalid or expired' })
  }
}

// ── Admin OR manager OR receptionist ─────────────────────────
const protectAdminOrFullAccess = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token)
      return res.status(401).json({ success:false, message:'No token provided' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role === 'admin') {
      req.admin = decoded; req.role = 'admin'; return next()
    }

    if (decoded.role === 'employee') {
      const employee = await findEmployee(decoded)
      if (!employee)
        return res.status(403).json({ success:false, message:'Employee not found or inactive' })

      const accessRole = employee.accessRole || 'employee'
      const isAllowed  = accessRole === 'manager' ||
                         accessRole === 'receptionist' ||
                         employee.hasFullAccess === true

      if (!isAllowed)
        return res.status(403).json({
          success: false,
          message: 'Insufficient access. Contact admin.',
        })

      req.employee = buildEmployeeReq(employee)
      req.role     = accessRole
      return next()
    }

    return res.status(403).json({ success:false, message:'Access denied' })
  } catch (e) {
    return res.status(401).json({ success:false, message:'Token invalid or expired' })
  }
}

// ── Customer only ─────────────────────────────────────────────
const protectCustomer = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token)
      return res.status(401).json({ success:false, message:'No token provided' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.role !== 'customer')
      return res.status(403).json({ success:false, message:'Customer access required' })
    req.customer = decoded; next()
  } catch (e) {
    return res.status(401).json({ success:false, message:'Token invalid or expired' })
  }
}

// ── Helpers ───────────────────────────────────────────────────
const findEmployee = async (decoded) => {
  let employee = null

  // Try MongoDB _id first
  if (decoded.employeeId) {
    try {
      const mongoose = require('mongoose')
      if (mongoose.Types.ObjectId.isValid(decoded.employeeId)) {
        employee = await Employee.findById(decoded.employeeId).lean()
      }
    } catch (e) { /* ignore */ }
  }

  // Fallback: find by employeeID string field
  if (!employee && decoded.employeeID) {
    employee = await Employee.findOne({ employeeID:decoded.employeeID }).lean()
  }

  // Must be active
  if (employee && !employee.isActive) return null
  return employee
}

const buildEmployeeReq = (employee) => ({
  employeeId:    employee._id.toString(),
  employeeID:    employee.employeeID,
  name:          employee.name,
  role:          'employee',
  employeeRole:  employee.role         || 'all',
  accessRole:    employee.accessRole   || 'employee',
  hasFullAccess: employee.hasFullAccess === true ||
                 employee.accessRole   === 'manager',
})

module.exports = {
  protect,
  protectEmployee,
  protectAdminOrEmployee,
  protectAdminOrFullAccess,
  protectCustomer,
}
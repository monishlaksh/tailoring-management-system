const jwt      = require('jsonwebtoken')
const Employee = require('../models/Employee')

const protect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ success:false, message:'No token provided' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.role !== 'admin')
      return res.status(403).json({ success:false, message:'Admin access required' })
    req.admin = decoded; req.role = 'admin'
    next()
  } catch (e) {
    return res.status(401).json({ success:false, message:'Token invalid or expired' })
  }
}

const protectEmployee = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ success:false, message:'No token provided' })
    const decoded  = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.role !== 'employee')
      return res.status(403).json({ success:false, message:'Employee access required' })
    const employee = await Employee.findById(decoded.employeeId).lean()
    if (!employee || !employee.isActive)
      return res.status(403).json({ success:false, message:'Employee not found or inactive' })
    req.employee = {
      employeeId:    decoded.employeeId,
      employeeID:    employee.employeeID,
      name:          employee.name,
      role:          'employee',
      employeeRole:  employee.role,
      accessRole:    employee.accessRole || 'employee',
      hasFullAccess: employee.hasFullAccess || false,
    }
    req.role = 'employee'
    next()
  } catch (e) {
    return res.status(401).json({ success:false, message:'Token invalid or expired' })
  }
}

// Admin OR any logged-in employee (read access)
// In backend/src/middleware/auth.js
const protectAdminOrEmployee = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token)
      return res.status(401).json({ success:false, message:'No token provided' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role === 'admin') {
      req.admin = decoded
      req.role  = 'admin'
      return next()
    }

    if (decoded.role === 'employee') {
      // Try finding by _id first, fallback to employeeID string
      let employee = null

      if (decoded.employeeId) {
        try {
          employee = await Employee.findById(decoded.employeeId).lean()
        } catch (e) {
          // Invalid ObjectId — try by employeeID string
        }
      }

      // Fallback: find by employeeID field
      if (!employee && decoded.employeeID) {
        employee = await Employee.findOne({ employeeID:decoded.employeeID }).lean()
      }

      if (!employee || !employee.isActive)
        return res.status(403).json({ success:false, message:'Employee not found or inactive' })

      req.employee = {
        employeeId:    employee._id.toString(),
        employeeID:    employee.employeeID,
        name:          employee.name,
        role:          'employee',
        employeeRole:  employee.role         || 'all',
        accessRole:    employee.accessRole   || 'employee',
        hasFullAccess: employee.hasFullAccess || employee.accessRole === 'manager',
      }
      req.role = 'employee'
      return next()
    }

    return res.status(403).json({ success:false, message:'Access denied' })
  } catch (e) {
    return res.status(401).json({ success:false, message:'Token invalid or expired' })
  }
}
// Admin OR manager OR receptionist (can create orders/customers)
const protectAdminOrFullAccess = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token)
      return res.status(401).json({ success:false, message:'No token provided' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role === 'admin') {
      req.admin = decoded
      req.role  = 'admin'
      return next()
    }

    if (decoded.role === 'employee') {
      let employee = null

      if (decoded.employeeId) {
        try {
          employee = await Employee.findById(decoded.employeeId).lean()
        } catch (e) { /* invalid id */ }
      }
      if (!employee && decoded.employeeID) {
        employee = await Employee.findOne({ employeeID:decoded.employeeID }).lean()
      }

      if (!employee || !employee.isActive)
        return res.status(403).json({ success:false, message:'Employee not found or inactive' })

      const accessRole = employee.accessRole || 'employee'

      if (accessRole === 'manager' || accessRole === 'receptionist' || employee.hasFullAccess) {
        req.employee = {
          employeeId:    employee._id.toString(),
          employeeID:    employee.employeeID,
          name:          employee.name,
          role:          'employee',
          employeeRole:  employee.role || 'all',
          accessRole,
          hasFullAccess: employee.hasFullAccess || accessRole === 'manager',
        }
        req.role = accessRole
        return next()
      }

      return res.status(403).json({ success:false, message:'Insufficient access. Contact admin.' })
    }

    return res.status(403).json({ success:false, message:'Access denied' })
  } catch (e) {
    return res.status(401).json({ success:false, message:'Token invalid or expired' })
  }
}

const protectCustomer = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ success:false, message:'No token provided' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.role !== 'customer')
      return res.status(403).json({ success:false, message:'Customer access required' })
    req.customer = decoded; next()
  } catch (e) {
    return res.status(401).json({ success:false, message:'Token invalid or expired' })
  }
}

module.exports = {
  protect,
  protectEmployee,
  protectAdminOrEmployee,
  protectAdminOrFullAccess,
  protectCustomer,
}
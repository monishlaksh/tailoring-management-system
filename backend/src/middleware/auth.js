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
const protectAdminOrEmployee = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ success:false, message:'No token provided' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role === 'admin') {
      req.admin = decoded; req.role = 'admin'; return next()
    }
    if (decoded.role === 'employee') {
      const employee = await Employee.findById(decoded.employeeId).lean()
      if (!employee || !employee.isActive)
        return res.status(403).json({ success:false, message:'Employee inactive' })
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
    if (!token) return res.status(401).json({ success:false, message:'No token provided' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role === 'admin') {
      req.admin = decoded; req.role = 'admin'; return next()
    }
    if (decoded.role === 'employee') {
      const employee = await Employee.findById(decoded.employeeId).lean()
      if (!employee || !employee.isActive)
        return res.status(403).json({ success:false, message:'Employee inactive' })

      const accessRole = employee.accessRole || 'employee'

      // Manager = full admin access
      // Receptionist = can create orders/customers only
      if (accessRole === 'manager' || accessRole === 'receptionist' || employee.hasFullAccess) {
        req.employee = {
          employeeId:    decoded.employeeId,
          employeeID:    employee.employeeID,
          name:          employee.name,
          role:          'employee',
          employeeRole:  employee.role,
          accessRole,
          hasFullAccess: employee.hasFullAccess || accessRole === 'manager',
        }
        req.role = accessRole === 'manager' ? 'employee_admin' : 'employee_receptionist'
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
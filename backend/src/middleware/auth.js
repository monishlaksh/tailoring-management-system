const jwt      = require('jsonwebtoken')
const Employee = require('../models/Employee')

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success:false, message:'No token' })
    const token   = authHeader.split(' ')[1]
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

// Admin OR employee with full access
const protectAdminOrFullAccess = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success:false, message:'No token' })
    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role === 'admin') {
      req.admin = decoded
      req.role  = 'admin'
      return next()
    }

    if (decoded.role === 'employee') {
      const employee = await Employee.findById(decoded.employeeId)
      if (!employee || !employee.isActive)
        return res.status(403).json({ success:false, message:'Employee not found or inactive' })
      if (!employee.hasFullAccess)
        return res.status(403).json({ success:false, message:'Full access required. Contact admin.' })
      req.employee = {
        employeeId:    decoded.employeeId,
        employeeID:    employee.employeeID,
        name:          employee.name,
        role:          'employee',
        employeeRole:  employee.role,
        hasFullAccess: true,
      }
      req.role = 'employee_admin'
      return next()
    }

    return res.status(403).json({ success:false, message:'Access denied' })
  } catch (e) {
    return res.status(401).json({ success:false, message:'Token invalid or expired' })
  }
}

const protectEmployee = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success:false, message:'No token' })
    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.role !== 'employee')
      return res.status(403).json({ success:false, message:'Employee access required' })
    const employee = await Employee.findById(decoded.employeeId)
    if (!employee || !employee.isActive)
      return res.status(403).json({ success:false, message:'Employee not found or inactive' })
    req.employee = {
      employeeId:    decoded.employeeId,
      employeeID:    employee.employeeID,
      name:          employee.name,
      role:          'employee',
      employeeRole:  employee.role,
      hasFullAccess: employee.hasFullAccess,
    }
    req.role = 'employee'
    next()
  } catch (e) {
    return res.status(401).json({ success:false, message:'Token invalid or expired' })
  }
}

const protectAdminOrEmployee = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success:false, message:'No token' })
    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role === 'admin') {
      req.admin = decoded; req.role = 'admin'; return next()
    }

    if (decoded.role === 'employee') {
      const employee = await Employee.findById(decoded.employeeId)
      if (!employee || !employee.isActive)
        return res.status(403).json({ success:false, message:'Employee inactive' })
      req.employee = {
        employeeId:    decoded.employeeId,
        employeeID:    employee.employeeID,
        name:          employee.name,
        role:          'employee',
        employeeRole:  employee.role,
        hasFullAccess: employee.hasFullAccess,
      }
      req.role = 'employee'
      return next()
    }

    return res.status(403).json({ success:false, message:'Access denied' })
  } catch (e) {
    return res.status(401).json({ success:false, message:'Token invalid or expired' })
  }
}

const protectCustomer = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success:false, message:'No token' })
    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.role !== 'customer')
      return res.status(403).json({ success:false, message:'Customer access required' })
    req.customer = decoded
    next()
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
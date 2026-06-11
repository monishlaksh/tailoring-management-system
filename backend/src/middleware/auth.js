const jwt      = require('jsonwebtoken')
const Employee = require('../models/Employee')

// Admin only
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success:false, message:'No token. Access denied.' })
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

// Employee only
const protectEmployee = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success:false, message:'No token. Access denied.' })
    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.role !== 'employee')
      return res.status(403).json({ success:false, message:'Employee access required' })
    const employee = await Employee.findById(decoded.employeeId)
    if (!employee || !employee.isActive)
      return res.status(403).json({ success:false, message:'Employee not found or inactive' })
    req.employee = {
      employeeId:   decoded.employeeId,
      employeeID:   employee.employeeID,
      name:         employee.name,
      role:         'employee',
      employeeRole: employee.role, // cutting/stitching/finishing/all
    }
    req.role = 'employee'
    next()
  } catch (e) {
    return res.status(401).json({ success:false, message:'Token invalid or expired' })
  }
}

// Admin OR Employee
const protectAdminOrEmployee = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success:false, message:'No token. Access denied.' })
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
      req.employee = {
        employeeId:   decoded.employeeId,
        employeeID:   employee.employeeID,
        name:         employee.name,
        role:         'employee',
        employeeRole: employee.role,
      }
      req.role = 'employee'
      return next()
    }

    return res.status(403).json({ success:false, message:'Access denied' })
  } catch (e) {
    return res.status(401).json({ success:false, message:'Token invalid or expired' })
  }
}

// Customer only
const protectCustomer = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success:false, message:'No token. Access denied.' })
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

module.exports = { protect, protectEmployee, protectAdminOrEmployee, protectCustomer }
const jwt      = require('jsonwebtoken')
const Employee = require('../models/Employee')

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'No token. Access denied.' })
    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Admin access required' })
    req.admin = decoded
    req.role  = 'admin'
    next()
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' })
  }
}

const protectEmployee = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'No token. Access denied.' })
    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.role !== 'employee')
      return res.status(403).json({ success: false, message: 'Employee access required' })
    const employee = await Employee.findById(decoded.employeeId)
    if (!employee || !employee.isActive)
      return res.status(403).json({ success: false, message: 'Employee not found or inactive' })
    req.employee = {
      employeeId: decoded.employeeId,
      employeeID: decoded.employeeID,
      name:       decoded.name,
      role:       'employee',
    }
    req.role = 'employee'
    next()
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' })
  }
}

const protectAdminOrEmployee = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'No token. Access denied.' })

    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Log decoded token to see exactly what's inside
    console.log('protectAdminOrEmployee decoded token:', decoded)

    if (decoded.role === 'admin') {
      req.admin = decoded
      req.role  = 'admin'
      return next()
    }

    if (decoded.role === 'employee') {
      const employee = await Employee.findById(decoded.employeeId)
      if (!employee || !employee.isActive)
        return res.status(403).json({ success: false, message: 'Employee not found or inactive' })

      console.log('Employee from DB:', {
        employeeID: employee.employeeID,
        name:       employee.name,
      })

      req.employee = {
        employeeId: decoded.employeeId,
        employeeID: employee.employeeID, // use DB value — most reliable
        name:       employee.name,
        role:       'employee',
      }
      req.role = 'employee'
      return next()
    }

    return res.status(403).json({ success: false, message: 'Access denied' })
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' })
  }
}

const protectCustomer = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'No token. Access denied.' })
    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.role !== 'customer')
      return res.status(403).json({ success: false, message: 'Customer access required' })
    req.customer = decoded
    next()
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' })
  }
}

module.exports = { protect, protectEmployee, protectAdminOrEmployee, protectCustomer }
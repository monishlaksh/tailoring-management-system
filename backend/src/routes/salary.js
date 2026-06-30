const express   = require('express')
const Allotment = require('../models/Allotment')
const Employee  = require('../models/Employee')
const Order     = require('../models/Order')
const { protect } = require('../middleware/auth')
const router    = express.Router()

// GET salary breakdown — all employees, optionally filtered by date range
router.get('/', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const dateFilter = {}
    if (startDate) dateFilter.$gte = new Date(startDate)
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23,59,59,999)
      dateFilter.$lte = end
    }

    const employees = await Employee.find({ isActive:true }).select('-password').lean()

    const result = await Promise.all(employees.map(async (emp) => {
      const query = {
        $or: [
          { 'cutting.employeeID':emp.employeeID,   'cutting.status':'completed'   },
          { 'stitching.employeeID':emp.employeeID, 'stitching.status':'completed' },
          { 'finishing.employeeID':emp.employeeID, 'finishing.status':'completed' },
        ],
      }
      const allotments = await Allotment.find(query).lean()

      let totalEarned = 0
      let totalOrders = 0
      const dailyBreakdown = {}

      allotments.forEach(a => {
        ['cutting','stitching','finishing'].forEach(stage => {
          if (a[stage]?.employeeID === emp.employeeID && a[stage]?.status === 'completed') {
            const completedAt = a[stage].completedAt
            if (!completedAt) return
            const date = new Date(completedAt)

            if (Object.keys(dateFilter).length > 0) {
              if (dateFilter.$gte && date < dateFilter.$gte) return
              if (dateFilter.$lte && date > dateFilter.$lte) return
            }

            const award = a[stage].award || 0
            totalEarned += award
            totalOrders += 1

            const dayKey = date.toISOString().split('T')[0]
            if (!dailyBreakdown[dayKey]) {
              dailyBreakdown[dayKey] = { date:dayKey, orders:0, amount:0 }
            }
            dailyBreakdown[dayKey].orders += 1
            dailyBreakdown[dayKey].amount += award
          }
        })
      })

      const dailyArray = Object.values(dailyBreakdown).sort((a,b) =>
        new Date(b.date) - new Date(a.date)
      )

      return {
        employeeID: emp.employeeID,
        name:       emp.name,
        role:       emp.role,
        totalOrders,
        totalEarned,
        dailyBreakdown: dailyArray,
      }
    }))

    result.sort((a,b) => b.totalEarned - a.totalEarned)

    res.json({ success:true, salaries:result })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// GET single employee salary detail
router.get('/:employeeID', protect, async (req, res) => {
  try {
    const { employeeID } = req.params
    const { startDate, endDate } = req.query

    const employee = await Employee.findOne({ employeeID }).select('-password').lean()
    if (!employee)
      return res.status(404).json({ success:false, message:'Employee not found' })

    const dateFilter = {}
    if (startDate) dateFilter.$gte = new Date(startDate)
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23,59,59,999)
      dateFilter.$lte = end
    }

    const query = {
      $or: [
        { 'cutting.employeeID':employeeID,   'cutting.status':'completed'   },
        { 'stitching.employeeID':employeeID, 'stitching.status':'completed' },
        { 'finishing.employeeID':employeeID, 'finishing.status':'completed' },
      ],
    }
    const allotments = await Allotment.find(query).lean()

    const entries = []
    allotments.forEach(a => {
      ['cutting','stitching','finishing'].forEach(stage => {
        if (a[stage]?.employeeID === employeeID && a[stage]?.status === 'completed') {
          const completedAt = a[stage].completedAt
          if (!completedAt) return
          const date = new Date(completedAt)
          if (dateFilter.$gte && date < dateFilter.$gte) return
          if (dateFilter.$lte && date > dateFilter.$lte) return

          entries.push({
            orderID:     a.orderID,
            stage,
            award:       a[stage].award || 0,
            completedAt: a[stage].completedAt,
          })
        }
      })
    })

    entries.sort((a,b) => new Date(b.completedAt) - new Date(a.completedAt))

    const totalEarned = entries.reduce((s,e) => s+e.award, 0)

    res.json({
      success: true,
      employee: { employeeID:employee.employeeID, name:employee.name, role:employee.role },
      totalOrders: entries.length,
      totalEarned,
      entries,
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

module.exports = router
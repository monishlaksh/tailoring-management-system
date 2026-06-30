const express   = require('express')
const Allotment = require('../models/Allotment')
const Employee  = require('../models/Employee')
const Order     = require('../models/Order')
const { protect } = require('../middleware/auth')
const router    = express.Router()

// GET salary breakdown — filterable by period
router.get('/', protect, async (req, res) => {
  try {
    const { period = 'daily' } = req.query

    const now = new Date()
    let defaultStart = new Date()
    if (period === 'daily')   defaultStart.setDate(now.getDate() - 14)
    if (period === 'weekly')  defaultStart.setDate(now.getDate() - 84)
    if (period === 'monthly') defaultStart.setMonth(now.getMonth() - 12)
    defaultStart.setHours(0,0,0,0)

    const startDate = req.query.startDate ? new Date(req.query.startDate) : defaultStart
    const endDate   = req.query.endDate ? new Date(req.query.endDate) : now
    endDate.setHours(23,59,59,999)

    const groupKey = (date) => {
      const d = new Date(date)
      if (period === 'daily') {
        return d.toISOString().split('T')[0]
      } else if (period === 'weekly') {
        const onejan = new Date(d.getFullYear(), 0, 1)
        const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7)
        return `${d.getFullYear()}-W${String(week).padStart(2,'0')}`
      } else {
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
      }
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
      const periodBreakdown = {}

      allotments.forEach(a => {
        ['cutting','stitching','finishing'].forEach(stage => {
          if (a[stage]?.employeeID === emp.employeeID && a[stage]?.status === 'completed') {
            const completedAt = a[stage].completedAt
            if (!completedAt) return
            const date = new Date(completedAt)

            if (date < startDate || date > endDate) return

            const award = a[stage].award || 0
            totalEarned += award
            totalOrders += 1

            const key = groupKey(date)
            if (!periodBreakdown[key]) {
              periodBreakdown[key] = { period:key, orders:0, amount:0 }
            }
            periodBreakdown[key].orders += 1
            periodBreakdown[key].amount += award
          }
        })
      })

      const breakdownArray = Object.values(periodBreakdown).sort((a,b) =>
        b.period.localeCompare(a.period)
      )

      return {
        employeeID: emp.employeeID,
        name:       emp.name,
        role:       emp.role,
        totalOrders,
        totalEarned,
        breakdown:  breakdownArray,
      }
    }))

    result.sort((a,b) => b.totalEarned - a.totalEarned)

    res.json({ success:true, period, salaries:result })
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
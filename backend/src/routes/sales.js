const express   = require('express')
const Order     = require('../models/Order')
const Allotment = require('../models/Allotment')
const { protect } = require('../middleware/auth')
const router    = express.Router()

router.get('/', protect, async (req, res) => {
  try {
    const { period = 'daily' } = req.query

    // Auto date range based on period if not provided
    const now = new Date()
    let defaultStart = new Date()
    if (period === 'daily')   defaultStart.setDate(now.getDate() - 14)
    if (period === 'weekly')  defaultStart.setDate(now.getDate() - 84)  // 12 weeks
    if (period === 'monthly') defaultStart.setMonth(now.getMonth() - 12)
    defaultStart.setHours(0,0,0,0)

    const startDate = req.query.startDate ? new Date(req.query.startDate) : defaultStart
    const endDate   = req.query.endDate ? new Date(req.query.endDate) : now
    endDate.setHours(23,59,59,999)

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).lean()

    const allotments = await Allotment.find().lean()

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

    const buckets = {}

    // Initialize empty buckets for the full range so chart always has bars
    const cursor = new Date(startDate)
    while (cursor <= endDate) {
      const key = groupKey(cursor)
      if (!buckets[key]) buckets[key] = { period:key, sales:0, expenses:0, orderCount:0 }
      if (period === 'daily')   cursor.setDate(cursor.getDate() + 1)
      if (period === 'weekly')  cursor.setDate(cursor.getDate() + 7)
      if (period === 'monthly') cursor.setMonth(cursor.getMonth() + 1)
    }

    // Sales
    orders.forEach(o => {
      const key = groupKey(o.createdAt)
      if (!buckets[key]) buckets[key] = { period:key, sales:0, expenses:0, orderCount:0 }
      buckets[key].sales += o.unitCost || 0
      buckets[key].orderCount += 1
    })

    // Expenses
    allotments.forEach(a => {
      ['cutting','stitching','finishing'].forEach(stage => {
        if (a[stage]?.status === 'completed' && a[stage]?.completedAt) {
          const date = new Date(a[stage].completedAt)
          if (date < startDate || date > endDate) return
          const key = groupKey(date)
          if (!buckets[key]) buckets[key] = { period:key, sales:0, expenses:0, orderCount:0 }
          buckets[key].expenses += a[stage].award || 0
        }
      })
    })

    const result = Object.values(buckets)
      .map(b => ({ ...b, profit: b.sales - b.expenses }))
      .sort((a,b) => a.period.localeCompare(b.period))

    const totals = result.reduce((acc, b) => ({
      sales:    acc.sales + b.sales,
      expenses: acc.expenses + b.expenses,
      profit:   acc.profit + b.profit,
      orders:   acc.orders + b.orderCount,
    }), { sales:0, expenses:0, profit:0, orders:0 })

    res.json({
      success: true,
      period,
      startDate: startDate.toISOString(),
      endDate:   endDate.toISOString(),
      data: result,
      totals,
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

module.exports = router
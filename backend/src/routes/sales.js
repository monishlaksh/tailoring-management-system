const express   = require('express')
const Order     = require('../models/Order')
const Allotment = require('../models/Allotment')
const { protect } = require('../middleware/auth')
const router    = express.Router()

// GET sales vs expenses — filterable by period
router.get('/', protect, async (req, res) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query

    const dateFilter = {}
    if (startDate) dateFilter.$gte = new Date(startDate)
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23,59,59,999)
      dateFilter.$lte = end
    }

    const orderQuery = {}
    if (Object.keys(dateFilter).length > 0) orderQuery.createdAt = dateFilter

    const orders = await Order.find(orderQuery).lean()
    const allotments = await Allotment.find().lean()

    // Group sales by period key
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

    // Sales (order revenue)
    orders.forEach(o => {
      const key = groupKey(o.createdAt)
      if (!buckets[key]) buckets[key] = { period:key, sales:0, expenses:0, orderCount:0 }
      buckets[key].sales += o.unitCost || 0
      buckets[key].orderCount += 1
    })

    // Expenses (employee awards) — grouped by completion date
    allotments.forEach(a => {
      ['cutting','stitching','finishing'].forEach(stage => {
        if (a[stage]?.status === 'completed' && a[stage]?.completedAt) {
          const date = new Date(a[stage].completedAt)
          if (dateFilter.$gte && date < dateFilter.$gte) return
          if (dateFilter.$lte && date > dateFilter.$lte) return
          const key = groupKey(a[stage].completedAt)
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

    res.json({ success:true, period, data:result, totals })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

module.exports = router
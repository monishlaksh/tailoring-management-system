const express   = require('express')
const Order     = require('../models/Order')
const Allotment = require('../models/Allotment')
const Expense   = require('../models/Expense')
const { protect } = require('../middleware/auth')
const router    = express.Router()

router.get('/', protect, async (req, res) => {
  try {
    const { period = 'daily' } = req.query

    const now = new Date()
    let startDate, endDate

    if (req.query.startDate && req.query.endDate) {
      startDate = new Date(req.query.startDate)
      endDate   = new Date(req.query.endDate)
    } else if (period === 'daily') {
      startDate = new Date(now); startDate.setDate(now.getDate()-14); startDate.setHours(0,0,0,0)
      endDate   = new Date(now); endDate.setHours(23,59,59,999)
    } else if (period === 'weekly') {
      startDate = new Date(now); startDate.setDate(now.getDate()-84); startDate.setHours(0,0,0,0)
      endDate   = new Date(now); endDate.setHours(23,59,59,999)
    } else {
      startDate = new Date(now); startDate.setMonth(now.getMonth()-12); startDate.setHours(0,0,0,0)
      endDate   = new Date(now); endDate.setHours(23,59,59,999)
    }

    const groupKey = (date) => {
      const d = new Date(date)
      if (period === 'daily') return d.toISOString().split('T')[0]
      if (period === 'weekly') {
        const onejan = new Date(d.getFullYear(),0,1)
        const week   = Math.ceil((((d-onejan)/86400000)+onejan.getDay()+1)/7)
        return `${d.getFullYear()}-W${String(week).padStart(2,'0')}`
      }
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    }

    // Pre-fill empty buckets
    const buckets = {}
    const cursor  = new Date(startDate)
    while (cursor <= endDate) {
      const key = groupKey(cursor)
      if (!buckets[key]) {
        buckets[key] = { period:key, sales:0, salaryCost:0, shopExpenses:0, orderCount:0 }
      }
      if (period === 'daily')   cursor.setDate(cursor.getDate()+1)
      if (period === 'weekly')  cursor.setDate(cursor.getDate()+7)
      if (period === 'monthly') cursor.setMonth(cursor.getMonth()+1)
    }

    // Sales from orders
    const orders = await Order.find({ createdAt:{ $gte:startDate, $lte:endDate } }).lean()
    orders.forEach(o => {
      const key = groupKey(o.createdAt)
      if (!buckets[key]) buckets[key] = { period:key, sales:0, salaryCost:0, shopExpenses:0, orderCount:0 }
      buckets[key].sales      += o.unitCost || 0
      buckets[key].orderCount += 1
    })

    // Salary cost from allotments (employee awards)
    const allotments = await Allotment.find().lean()
    allotments.forEach(a => {
      ;['cutting','stitching','finishing'].forEach(stage => {
        if (a[stage]?.status==='completed' && a[stage]?.completedAt) {
          const date = new Date(a[stage].completedAt)
          if (date < startDate || date > endDate) return
          const key = groupKey(date)
          if (!buckets[key]) buckets[key] = { period:key, sales:0, salaryCost:0, shopExpenses:0, orderCount:0 }
          buckets[key].salaryCost += a[stage].award || 0
        }
      })
    })

    // Shop expenses
    const expenses = await Expense.find({ date:{ $gte:startDate, $lte:endDate } }).lean()
    expenses.forEach(e => {
      const key = groupKey(e.date)
      if (!buckets[key]) buckets[key] = { period:key, sales:0, salaryCost:0, shopExpenses:0, orderCount:0 }
      buckets[key].shopExpenses += e.amount || 0
    })

    const result = Object.values(buckets)
      .map(b => ({
        ...b,
        totalExpenses: b.salaryCost + b.shopExpenses,
        profit:        b.sales - b.salaryCost - b.shopExpenses,
      }))
      .sort((a,b) => a.period.localeCompare(b.period))

    const totals = result.reduce((acc,b) => ({
      sales:        acc.sales        + b.sales,
      salaryCost:   acc.salaryCost   + b.salaryCost,
      shopExpenses: acc.shopExpenses + b.shopExpenses,
      totalExpenses:acc.totalExpenses+ b.totalExpenses,
      profit:       acc.profit       + b.profit,
      orders:       acc.orders       + b.orderCount,
    }), { sales:0, salaryCost:0, shopExpenses:0, totalExpenses:0, profit:0, orders:0 })

    res.json({ success:true, period, data:result, totals })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

module.exports = router
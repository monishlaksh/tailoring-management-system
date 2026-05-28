const express          = require('express')
const DeliveryCalendar = require('../models/DeliveryCalendar')
const Order            = require('../models/Order')
const { protect }      = require('../middleware/auth')
const router           = express.Router()

router.get('/date/:date', protect, async (req, res) => {
  try {
    const { date } = req.params
    const entries      = await DeliveryCalendar.find({ date })
    const totalPieces  = entries.reduce((sum, e) => sum + e.pieceCount, 0)
    const capacity     = 30
    res.json({
      success: true, date, entries, totalPieces, capacity,
      isOverloaded: totalPieces >= capacity,
      percentUsed: Math.round((totalPieces / capacity) * 100),
    })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

router.get('/month/:year/:month', protect, async (req, res) => {
  try {
    const { year, month } = req.params
    const prefix  = `${year}-${String(month).padStart(2, '0')}`
    const entries = await DeliveryCalendar.find({ date: { $regex: `^${prefix}` } })
    const summary = {}
    entries.forEach(e => {
      if (!summary[e.date]) summary[e.date] = { total: 0, breakdown: [] }
      summary[e.date].total += e.pieceCount
      summary[e.date].breakdown.push({ clothType: e.clothType, pieceCount: e.pieceCount })
    })
    res.json({ success: true, year, month, summary })
  } catch (e) { res.status(500).json({ success: false, message: e.message }) }
})

module.exports = router
const express  = require('express')
const Expense  = require('../models/Expense')
const { protect } = require('../middleware/auth')
const router   = express.Router()

const getNextExpenseID = async () => {
  const last = await Expense.findOne().sort({ expenseID:-1 }).lean()
  if (!last) return 'EXP000001'
  const num  = parseInt(last.expenseID.replace('EXP',''), 10)
  return `EXP${String(isNaN(num) ? 1 : num+1).padStart(6,'0')}`
}

// GET all expenses — with optional date filter
router.get('/', protect, async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query
    const query = {}
    if (category) query.category = category
    if (startDate || endDate) {
      query.date = {}
      if (startDate) query.date.$gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23,59,59,999)
        query.date.$lte = end
      }
    }
    const expenses = await Expense.find(query).sort({ date:-1 })
    const total    = expenses.reduce((s,e) => s+e.amount, 0)
    res.json({ success:true, expenses, total })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// GET summary by category
router.get('/summary', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const match = {}
    if (startDate || endDate) {
      match.date = {}
      if (startDate) match.date.$gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23,59,59,999)
        match.date.$lte = end
      }
    }
    const summary = await Expense.aggregate([
      { $match: match },
      { $group: { _id:'$category', total:{ $sum:'$amount' }, count:{ $sum:1 } } },
      { $sort: { total:-1 } },
    ])
    const grandTotal = summary.reduce((s,c) => s+c.total, 0)
    res.json({ success:true, summary, grandTotal })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST create expense
router.post('/', protect, async (req, res) => {
  try {
    const { title, category, amount, date, notes, paidBy, isRecurring } = req.body
    if (!title?.trim())
      return res.status(400).json({ success:false, message:'Title required' })
    if (!amount || amount <= 0)
      return res.status(400).json({ success:false, message:'Valid amount required' })

    const expenseID = await getNextExpenseID()
    const expense   = await Expense.create({
      expenseID,
      title:       title.trim(),
      category:    category || 'Other',
      amount:      parseFloat(amount),
      date:        date ? new Date(date) : new Date(),
      notes:       notes || '',
      paidBy:      paidBy || 'Admin',
      isRecurring: isRecurring || false,
    })
    res.status(201).json({ success:true, message:'Expense added', expense })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// PUT update expense
router.put('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id, req.body, { new:true }
    )
    if (!expense)
      return res.status(404).json({ success:false, message:'Not found' })
    res.json({ success:true, expense })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// DELETE expense
router.delete('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id)
    if (!expense)
      return res.status(404).json({ success:false, message:'Not found' })
    res.json({ success:true, message:'Deleted' })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

module.exports = router
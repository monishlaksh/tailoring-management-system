const express           = require('express')
const AlterationOption  = require('../models/AlterationOption')
const { protect, protectAdminOrEmployee } = require('../middleware/auth')
const router            = express.Router()

// GET all active — admin and employee
router.get('/', protectAdminOrEmployee, async (req, res) => {
  try {
    const options = await AlterationOption.find({ isActive:true }).sort({ name:1 })
    res.json({ success:true, options })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// GET all including inactive — admin only
router.get('/all', protect, async (req, res) => {
  try {
    const options = await AlterationOption.find().sort({ name:1 })
    res.json({ success:true, options })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST create — admin only
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, extraCost } = req.body
    if (!name || !name.trim())
      return res.status(400).json({ success:false, message:'Name is required' })

    const existing = await AlterationOption.findOne({ name:name.trim() })
    if (existing)
      return res.status(400).json({ success:false, message:'Alteration option already exists' })

    const option = await AlterationOption.create({
      name:        name.trim(),
      description: description || '',
      extraCost:   parseFloat(extraCost) || 0,
    })
    res.status(201).json({ success:true, message:'Alteration option created', option })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// PUT update — admin only
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, description, extraCost, isActive } = req.body
    const option = await AlterationOption.findById(req.params.id)
    if (!option)
      return res.status(404).json({ success:false, message:'Option not found' })

    if (name)                          option.name        = name.trim()
    if (description !== undefined)     option.description = description
    if (extraCost   !== undefined)     option.extraCost   = parseFloat(extraCost) || 0
    if (typeof isActive === 'boolean') option.isActive    = isActive

    await option.save()
    res.json({ success:true, message:'Option updated', option })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// DELETE — admin only
router.delete('/:id', protect, async (req, res) => {
  try {
    const option = await AlterationOption.findByIdAndUpdate(
      req.params.id,
      { isActive:false },
      { new:true }
    )
    if (!option)
      return res.status(404).json({ success:false, message:'Option not found' })
    res.json({ success:true, message:'Option deactivated' })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

module.exports = router
const express          = require('express')
const AlterationOption = require('../models/AlterationOption')
const { protect, protectAdminOrEmployee } = require('../middleware/auth')
const router           = express.Router()


// TEMP — reset and re-seed alteration options (remove after use)
router.post('/reset-seed', protect, async (req, res) => {
  try {
    await AlterationOption.deleteMany({})
    const seedAlterationOptions = require('../config/seedAlterationOptions')
    await seedAlterationOptions()
    const options = await AlterationOption.find()
    res.json({ success:true, message:`Re-seeded ${options.length} options`, options })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})
// GET active options — optionally filter by cloth type
router.get('/', protectAdminOrEmployee, async (req, res) => {
  try {
    const { clothType } = req.query
    let query = { isActive:true }

    if (clothType) {
      // Return options that are universal (empty clothTypes)
      // OR specifically include this cloth type
      query.$or = [
        { clothTypes:{ $size:0 } },
        { clothTypes:{ $exists:false } },
        { clothTypes:clothType },
      ]
    }

    const options = await AlterationOption.find(query).sort({ name:1 })
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

// POST create
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, extraCost, clothTypes } = req.body
    if (!name?.trim())
      return res.status(400).json({ success:false, message:'Name is required' })

    const existing = await AlterationOption.findOne({ name:name.trim() })
    if (existing)
      return res.status(400).json({ success:false, message:'Already exists' })

    const option = await AlterationOption.create({
      name:        name.trim(),
      description: description || '',
      extraCost:   parseFloat(extraCost) || 0,
      clothTypes:  clothTypes || [], // empty = all cloth types
    })
    res.status(201).json({ success:true, message:'Created', option })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// PUT update
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, description, extraCost, isActive, clothTypes } = req.body
    const option = await AlterationOption.findById(req.params.id)
    if (!option)
      return res.status(404).json({ success:false, message:'Not found' })

    if (name)                          option.name        = name.trim()
    if (description !== undefined)     option.description = description
    if (extraCost   !== undefined)     option.extraCost   = parseFloat(extraCost)||0
    if (typeof isActive === 'boolean') option.isActive    = isActive
    if (clothTypes  !== undefined)     option.clothTypes  = clothTypes

    await option.save()
    res.json({ success:true, message:'Updated', option })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// DELETE
router.delete('/:id', protect, async (req, res) => {
  try {
    const option = await AlterationOption.findByIdAndUpdate(
      req.params.id, { isActive:false }, { new:true }
    )
    if (!option)
      return res.status(404).json({ success:false, message:'Not found' })
    res.json({ success:true, message:'Deactivated' })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

module.exports = router
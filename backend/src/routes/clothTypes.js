const express   = require('express')
const ClothType = require('../models/ClothType')
const { protect, protectAdminOrEmployee } = require('../middleware/auth')
const router    = express.Router()

// GET all cloth types — admin and employee can read
router.get('/', protectAdminOrEmployee, async (req, res) => {
  try {
    const clothTypes = await ClothType.find({ isActive: true }).sort({ name: 1 })
    res.json({ success: true, clothTypes })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// GET all including inactive — admin only
router.get('/all', protect, async (req, res) => {
  try {
    const clothTypes = await ClothType.find().sort({ name: 1 })
    res.json({ success: true, clothTypes })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// GET single cloth type
router.get('/:id', protect, async (req, res) => {
  try {
    const clothType = await ClothType.findById(req.params.id)
    if (!clothType)
      return res.status(404).json({ success: false, message: 'Cloth type not found' })
    res.json({ success: true, clothType })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// POST create cloth type — admin only
router.post('/', protect, async (req, res) => {
  try {
    const { name, subtypes } = req.body
    if (!name || !name.trim())
      return res.status(400).json({ success: false, message: 'Cloth type name is required' })

    const existing = await ClothType.findOne({ name: name.trim() })
    if (existing)
      return res.status(400).json({ success: false, message: 'Cloth type already exists' })

    const clothType = await ClothType.create({
      name:     name.trim(),
      subtypes: subtypes || [],
    })
    res.status(201).json({ success: true, message: 'Cloth type created', clothType })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// PUT update cloth type name — admin only
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, isActive } = req.body
    const clothType = await ClothType.findById(req.params.id)
    if (!clothType)
      return res.status(404).json({ success: false, message: 'Cloth type not found' })

    if (name)                         clothType.name     = name.trim()
    if (typeof isActive === 'boolean') clothType.isActive = isActive

    await clothType.save()
    res.json({ success: true, message: 'Cloth type updated', clothType })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// DELETE cloth type — admin only
router.delete('/:id', protect, async (req, res) => {
  try {
    const clothType = await ClothType.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )
    if (!clothType)
      return res.status(404).json({ success: false, message: 'Cloth type not found' })
    res.json({ success: true, message: 'Cloth type deactivated' })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// POST add subtype — admin only
router.post('/:id/subtypes', protect, async (req, res) => {
  try {
    const { name, cost } = req.body
    if (!name || !name.trim())
      return res.status(400).json({ success: false, message: 'Subtype name is required' })

    const clothType = await ClothType.findById(req.params.id)
    if (!clothType)
      return res.status(404).json({ success: false, message: 'Cloth type not found' })

    const exists = clothType.subtypes.find(
      s => s.name.toLowerCase() === name.trim().toLowerCase()
    )
    if (exists)
      return res.status(400).json({ success: false, message: 'Subtype already exists' })

    clothType.subtypes.push({ name: name.trim(), cost: parseFloat(cost) || 0 })
    await clothType.save()

    res.json({ success: true, message: 'Subtype added', clothType })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// PUT update subtype — admin only
router.put('/:id/subtypes/:subtypeId', protect, async (req, res) => {
  try {
    const { name, cost, isActive } = req.body
    const clothType = await ClothType.findById(req.params.id)
    if (!clothType)
      return res.status(404).json({ success: false, message: 'Cloth type not found' })

    const subtype = clothType.subtypes.id(req.params.subtypeId)
    if (!subtype)
      return res.status(404).json({ success: false, message: 'Subtype not found' })

    if (name)                         subtype.name     = name.trim()
    if (cost !== undefined)           subtype.cost     = parseFloat(cost) || 0
    if (typeof isActive === 'boolean') subtype.isActive = isActive

    await clothType.save()
    res.json({ success: true, message: 'Subtype updated', clothType })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// DELETE subtype — admin only
router.delete('/:id/subtypes/:subtypeId', protect, async (req, res) => {
  try {
    const clothType = await ClothType.findById(req.params.id)
    if (!clothType)
      return res.status(404).json({ success: false, message: 'Cloth type not found' })

    clothType.subtypes = clothType.subtypes.filter(
      s => s._id.toString() !== req.params.subtypeId
    )
    await clothType.save()
    res.json({ success: true, message: 'Subtype removed', clothType })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

module.exports = router
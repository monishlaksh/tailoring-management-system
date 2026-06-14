const express   = require('express')
const ClothType = require('../models/ClothType')
const { protect, protectAdminOrEmployee } = require('../middleware/auth')
const router    = express.Router()

// GET all active
router.get('/', protectAdminOrEmployee, async (req, res) => {
  try {
    const clothTypes = await ClothType.find({ isActive:true }).sort({ name:1 })
    res.json({ success:true, clothTypes })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// GET all including inactive — admin only
router.get('/all', protect, async (req, res) => {
  try {
    const clothTypes = await ClothType.find().sort({ name:1 })
    res.json({ success:true, clothTypes })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST create cloth type
router.post('/', protect, async (req, res) => {
  try {
    const { name } = req.body
    if (!name?.trim())
      return res.status(400).json({ success:false, message:'Name required' })
    const existing = await ClothType.findOne({ name:name.trim() })
    if (existing)
      return res.status(400).json({ success:false, message:'Already exists' })
    const clothType = await ClothType.create({ name:name.trim(), types:[] })
    res.status(201).json({ success:true, clothType })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// PUT update cloth type
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, isActive } = req.body
    const ct = await ClothType.findById(req.params.id)
    if (!ct) return res.status(404).json({ success:false, message:'Not found' })
    if (name)                          ct.name     = name.trim()
    if (typeof isActive === 'boolean') ct.isActive = isActive
    await ct.save()
    res.json({ success:true, clothType:ct })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// ── TYPE routes (e.g. Half Sleeve, Backless) ─────────────────

// POST add type to cloth type
router.post('/:id/types', protect, async (req, res) => {
  try {
    const { name } = req.body
    if (!name?.trim())
      return res.status(400).json({ success:false, message:'Type name required' })
    const ct = await ClothType.findById(req.params.id)
    if (!ct) return res.status(404).json({ success:false, message:'Not found' })
    const exists = ct.types.find(t => t.name.toLowerCase() === name.trim().toLowerCase())
    if (exists)
      return res.status(400).json({ success:false, message:'Type already exists' })
    ct.types.push({ name:name.trim(), subtypes:[] })
    await ct.save()
    res.json({ success:true, clothType:ct })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// PUT update type
router.put('/:id/types/:typeId', protect, async (req, res) => {
  try {
    const { name, isActive } = req.body
    const ct = await ClothType.findById(req.params.id)
    if (!ct) return res.status(404).json({ success:false, message:'Not found' })
    const type = ct.types.id(req.params.typeId)
    if (!type) return res.status(404).json({ success:false, message:'Type not found' })
    if (name)                          type.name     = name.trim()
    if (typeof isActive === 'boolean') type.isActive = isActive
    await ct.save()
    res.json({ success:true, clothType:ct })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// DELETE type
router.delete('/:id/types/:typeId', protect, async (req, res) => {
  try {
    const ct = await ClothType.findById(req.params.id)
    if (!ct) return res.status(404).json({ success:false, message:'Not found' })
    ct.types = ct.types.filter(t => t._id.toString() !== req.params.typeId)
    await ct.save()
    res.json({ success:true, clothType:ct })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// ── SUBTYPE routes (Normal, Lining) ──────────────────────────

// POST add subtype to a type
router.post('/:id/types/:typeId/subtypes', protect, async (req, res) => {
  try {
    const { name, cost } = req.body
    if (!name?.trim())
      return res.status(400).json({ success:false, message:'Subtype name required' })
    const ct = await ClothType.findById(req.params.id)
    if (!ct) return res.status(404).json({ success:false, message:'Not found' })
    const type = ct.types.id(req.params.typeId)
    if (!type) return res.status(404).json({ success:false, message:'Type not found' })
    const exists = type.subtypes.find(s => s.name.toLowerCase() === name.trim().toLowerCase())
    if (exists)
      return res.status(400).json({ success:false, message:'Subtype already exists' })
    type.subtypes.push({ name:name.trim(), cost:parseFloat(cost)||0 })
    await ct.save()
    res.json({ success:true, clothType:ct })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// PUT update subtype
router.put('/:id/types/:typeId/subtypes/:subtypeId', protect, async (req, res) => {
  try {
    const { name, cost, isActive } = req.body
    const ct = await ClothType.findById(req.params.id)
    if (!ct) return res.status(404).json({ success:false, message:'Not found' })
    const type = ct.types.id(req.params.typeId)
    if (!type) return res.status(404).json({ success:false, message:'Type not found' })
    const sub = type.subtypes.id(req.params.subtypeId)
    if (!sub) return res.status(404).json({ success:false, message:'Subtype not found' })
    if (name)                          sub.name     = name.trim()
    if (cost !== undefined)            sub.cost     = parseFloat(cost)||0
    if (typeof isActive === 'boolean') sub.isActive = isActive
    await ct.save()
    res.json({ success:true, clothType:ct })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// DELETE subtype
router.delete('/:id/types/:typeId/subtypes/:subtypeId', protect, async (req, res) => {
  try {
    const ct = await ClothType.findById(req.params.id)
    if (!ct) return res.status(404).json({ success:false, message:'Not found' })
    const type = ct.types.id(req.params.typeId)
    if (!type) return res.status(404).json({ success:false, message:'Type not found' })
    type.subtypes = type.subtypes.filter(
      s => s._id.toString() !== req.params.subtypeId
    )
    await ct.save()
    res.json({ success:true, clothType:ct })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

module.exports = router
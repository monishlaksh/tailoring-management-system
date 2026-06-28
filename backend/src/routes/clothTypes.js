const express   = require('express')
const ClothType = require('../models/ClothType')
const { protect, protectAdminOrEmployee } = require('../middleware/auth')
const router    = express.Router()

// GET active cloth types
router.get('/', protectAdminOrEmployee, async (req, res) => {
  try {
    const clothTypes = await ClothType.find({ isActive:true }).sort({ name:1 })
    res.json({ success:true, clothTypes })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// GET all including inactive
router.get('/all', protect, async (req, res) => {
  try {
    const clothTypes = await ClothType.find().sort({ name:1 })
    res.json({ success:true, clothTypes })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// Force reset and re-seed
router.post('/reset-seed', protect, async (req, res) => {
  try {
    await ClothType.deleteMany({})
    // Manually insert the defaults since seed fn checks count
    const ClothTypeModel = require('../models/ClothType')
    // Re-require fresh
    delete require.cache[require.resolve('../config/seedClothTypes')]
    const seed = require('../config/seedClothTypes')
    await seed()
    const count = await ClothType.countDocuments()
    res.json({ success:true, message:`Re-seeded ${count} cloth types with measurements` })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST create cloth type
router.post('/', protect, async (req, res) => {
  try {
    const { name, nameTa, measurements } = req.body
    if (!name?.trim())
      return res.status(400).json({ success:false, message:'Name required' })
    const existing = await ClothType.findOne({ name:name.trim() })
    if (existing)
      return res.status(400).json({ success:false, message:'Already exists' })
    const clothType = await ClothType.create({
      name:         name.trim(),
      nameTa:       nameTa || '',
      measurements: measurements || [],
      types:        [],
    })
    res.status(201).json({ success:true, clothType })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// PUT update cloth type
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, nameTa, isActive, measurements } = req.body
    const ct = await ClothType.findById(req.params.id)
    if (!ct) return res.status(404).json({ success:false, message:'Not found' })
    if (name)                          ct.name     = name.trim()
    if (nameTa !== undefined)          ct.nameTa   = nameTa
    if (typeof isActive === 'boolean') ct.isActive = isActive
    if (measurements !== undefined)    ct.measurements = measurements
    await ct.save()
    res.json({ success:true, clothType:ct })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// ── TYPE routes ──────────────────────────────────────────────

// POST add type
router.post('/:id/types', protect, async (req, res) => {
  try {
    const { name, nameTa, cost, empCost } = req.body
    if (!name?.trim())
      return res.status(400).json({ success:false, message:'Type name required' })
    const ct = await ClothType.findById(req.params.id)
    if (!ct) return res.status(404).json({ success:false, message:'Not found' })
    const exists = ct.types.find(t => t.name.toLowerCase() === name.trim().toLowerCase())
    if (exists)
      return res.status(400).json({ success:false, message:'Type already exists' })
    ct.types.push({
      name:     name.trim(),
      nameTa:   nameTa   || '',
      cost:     parseFloat(cost)    || 0,
      empCost:  parseFloat(empCost) || 0,
      subtypes: [],
    })
    await ct.save()
    res.json({ success:true, clothType:ct })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// PUT update type
router.put('/:id/types/:typeId', protect, async (req, res) => {
  try {
    const { name, nameTa, cost, empCost, isActive } = req.body
    const ct = await ClothType.findById(req.params.id)
    if (!ct) return res.status(404).json({ success:false, message:'Not found' })
    const type = ct.types.id(req.params.typeId)
    if (!type) return res.status(404).json({ success:false, message:'Type not found' })
    if (name)                          type.name     = name.trim()
    if (nameTa !== undefined)          type.nameTa   = nameTa
    if (cost !== undefined)            type.cost     = parseFloat(cost)    || 0
    if (empCost !== undefined)         type.empCost  = parseFloat(empCost) || 0
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

// ── SUBTYPE routes ───────────────────────────────────────────

// POST add subtype
router.post('/:id/types/:typeId/subtypes', protect, async (req, res) => {
  try {
    const { name, nameTa, cost } = req.body
    if (!name?.trim())
      return res.status(400).json({ success:false, message:'Subtype name required' })
    const ct = await ClothType.findById(req.params.id)
    if (!ct) return res.status(404).json({ success:false, message:'Not found' })
    const type = ct.types.id(req.params.typeId)
    if (!type) return res.status(404).json({ success:false, message:'Type not found' })
    const exists = type.subtypes.find(s => s.name.toLowerCase() === name.trim().toLowerCase())
    if (exists)
      return res.status(400).json({ success:false, message:'Subtype already exists' })
    type.subtypes.push({ name:name.trim(), nameTa:nameTa||'', cost:parseFloat(cost)||0 })
    await ct.save()
    res.json({ success:true, clothType:ct })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// PUT update subtype
router.put('/:id/types/:typeId/subtypes/:subId', protect, async (req, res) => {
  try {
    const { name, nameTa, cost, isActive } = req.body
    const ct = await ClothType.findById(req.params.id)
    if (!ct) return res.status(404).json({ success:false, message:'Not found' })
    const type = ct.types.id(req.params.typeId)
    if (!type) return res.status(404).json({ success:false, message:'Type not found' })
    const sub = type.subtypes.id(req.params.subId)
    if (!sub) return res.status(404).json({ success:false, message:'Subtype not found' })
    if (name)                          sub.name     = name.trim()
    if (nameTa !== undefined)          sub.nameTa   = nameTa
    if (cost !== undefined)            sub.cost     = parseFloat(cost)||0
    if (typeof isActive === 'boolean') sub.isActive = isActive
    await ct.save()
    res.json({ success:true, clothType:ct })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// DELETE subtype
router.delete('/:id/types/:typeId/subtypes/:subId', protect, async (req, res) => {
  try {
    const ct = await ClothType.findById(req.params.id)
    if (!ct) return res.status(404).json({ success:false, message:'Not found' })
    const type = ct.types.id(req.params.typeId)
    if (!type) return res.status(404).json({ success:false, message:'Type not found' })
    type.subtypes = type.subtypes.filter(s => s._id.toString() !== req.params.subId)
    await ct.save()
    res.json({ success:true, clothType:ct })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

module.exports = router
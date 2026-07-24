const express          = require('express')
const AlterationOption = require('../models/AlterationOption')
const { protect, protectAdminOrEmployee } = require('../middleware/auth')
const router           = express.Router()

// Force reset and re-seed — admin only
router.post('/reset-seed', protect, async (req, res) => {
  try {
    await AlterationOption.deleteMany({})

    const defaults = [
      { name:'Adjust Neckline',   description:'Modify the neckline shape or depth',        extraCost:80,  clothTypes:['Blouse','Saree Blouse'] },
      { name:'Add Lining',        description:'Add inner lining to the garment',           extraCost:150, clothTypes:['Blouse','Saree Blouse','Lehenga','Chudi'] },
      { name:'Add Padding',       description:'Add shoulder or chest padding',             extraCost:100, clothTypes:['Blouse','Saree Blouse','Shirt'] },
      { name:'Backless Design',   description:'Make the back open or backless',            extraCost:120, clothTypes:['Blouse','Saree Blouse'] },
      { name:'Add Sleeves',       description:'Add sleeves to sleeveless design',          extraCost:100, clothTypes:['Blouse','Saree Blouse'] },
      { name:'Remove Sleeves',    description:'Convert to sleeveless',                     extraCost:60,  clothTypes:['Blouse','Saree Blouse','Shirt'] },
      { name:'Tighten Waist',     description:'Take in the waist for a better fit',        extraCost:60,  clothTypes:['Pant','Chudi'] },
      { name:'Expand Waist',      description:'Let out the waist for more room',           extraCost:60,  clothTypes:['Pant','Chudi'] },
      { name:'Taper Leg',         description:'Make the leg narrower towards the bottom',  extraCost:80,  clothTypes:['Pant'] },
      { name:'Widen Leg',         description:'Make the leg wider',                        extraCost:80,  clothTypes:['Pant'] },
      { name:'Add Cuff',          description:'Add folded cuff at the bottom',             extraCost:50,  clothTypes:['Pant'] },
      { name:'Shorten Inseam',    description:'Reduce the inseam length',                  extraCost:40,  clothTypes:['Pant'] },
      { name:'Add Pocket',        description:'Add a chest or side pocket',                extraCost:60,  clothTypes:['Shirt'] },
      { name:'Collar Adjustment', description:'Modify collar shape or size',               extraCost:70,  clothTypes:['Shirt'] },
      { name:'Add Embroidery',    description:'Add embroidery work as specified',          extraCost:200, clothTypes:['Lehenga','Blouse','Saree Blouse'] },
      { name:'Add Dupatta',       description:'Attach or add dupatta',                     extraCost:150, clothTypes:['Lehenga','Chudi'] },
      { name:'Flare Adjustment',  description:'Adjust the flare of skirt/lehenga',        extraCost:100, clothTypes:['Lehenga'] },
      { name:'Tight Fitting',     description:'Make garment more fitted',                  extraCost:50,  clothTypes:['Blouse','Saree Blouse','Shirt','Chudi','Lehenga','Kids Dress','Custom Dress'] },
      { name:'Loose Fitting',     description:'Make garment more relaxed',                 extraCost:50,  clothTypes:['Blouse','Saree Blouse','Shirt','Chudi','Lehenga','Kids Dress','Custom Dress'] },
      { name:'Shorten Length',    description:'Reduce the overall length',                 extraCost:40,  clothTypes:['Blouse','Saree Blouse','Shirt','Chudi','Lehenga','Kids Dress','Custom Dress','Pant'] },
      { name:'Lengthen',          description:'Extend the overall length',                 extraCost:50,  clothTypes:['Blouse','Saree Blouse','Shirt','Chudi','Lehenga','Kids Dress','Custom Dress','Pant'] },
      { name:'Shorten Sleeve',    description:'Reduce the sleeve length',                  extraCost:30,  clothTypes:['Blouse','Saree Blouse','Shirt','Chudi','Custom Dress'] },
      { name:'Lengthen Sleeve',   description:'Extend the sleeve length',                  extraCost:40,  clothTypes:['Blouse','Saree Blouse','Shirt','Chudi','Custom Dress'] },
      { name:'Custom Alteration', description:'Special alteration as described in notes',  extraCost:0,   clothTypes:[] },
    ]

    await AlterationOption.insertMany(defaults)
    const count = await AlterationOption.countDocuments()
    res.json({ success:true, message:`Re-seeded ${count} alteration options` })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// GET active options — filter by cloth type
router.get('/', protectAdminOrEmployee, async (req, res) => {
  try {
    const { clothType } = req.query

    let query = { isActive:true }

    if (clothType && clothType.trim() !== '') {
      // Return options that either:
      // 1. Have empty clothTypes array (universal — like Custom Alteration)
      // 2. Specifically include this cloth type name
      query.$or = [
        { clothTypes: { $size:0 } },
        { clothTypes: { $in: [clothType.trim()] } },
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
// POST create
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, clothType, extraCost, empCost } = req.body
    const option = await AlterationOption.create({
      name:        name.trim(),
      description: description || '',
      clothType:   clothType   || 'all',
      extraCost:   parseFloat(extraCost) || 0,
      empCost:     parseFloat(empCost)   || 0,  // ← add
    })
    res.status(201).json({ success:true, option })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// PUT update
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, description, clothType, extraCost, empCost, isActive } = req.body
    const option = await AlterationOption.findByIdAndUpdate(
      req.params.id,
      {
        ...(name        && { name }),
        ...(description !== undefined && { description }),
        ...(clothType   && { clothType }),
        ...(extraCost   !== undefined && { extraCost: parseFloat(extraCost)||0 }),
        ...(empCost     !== undefined && { empCost:   parseFloat(empCost)||0   }),  // ← add
        ...(typeof isActive === 'boolean' && { isActive }),
      },
      { new:true }
    )
    if (!option) return res.status(404).json({ success:false, message:'Not found' })
    res.json({ success:true, option })
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

// DELETE (soft)
router.delete('/:id', protect, async (req, res) => {
  try {
    const option = await AlterationOption.findByIdAndUpdate(
      req.params.id,
      { isActive:false },
      { new:true }
    )
    if (!option)
      return res.status(404).json({ success:false, message:'Not found' })
    res.json({ success:true, message:'Deactivated' })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

module.exports = router
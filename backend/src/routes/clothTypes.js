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

    // Inline the seed data directly — don't use require() inside route
    const defaults = [
      {
        name:'Blouse', nameTa:'ரவிக்கை',
        measurements:[
          { key:'length',   label:'Length',   labelTa:'நீளம்',    required:true  },
          { key:'chest',    label:'Chest',    labelTa:'மார்பு',   required:true  },
          { key:'waist',    label:'Waist',    labelTa:'இடுப்பு',  required:false },
          { key:'shoulder', label:'Shoulder', labelTa:'தோள்',     required:false },
          { key:'sleeve',   label:'Sleeve',   labelTa:'கை நீளம்', required:false },
          { key:'neck',     label:'Neck',     labelTa:'கழுத்து',  required:false },
        ],
        types:[
          { name:'Half Sleeve', nameTa:'அரை கை',      cost:300, empCost:50, subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 },{ name:'Lining', nameTa:'லைனிங்', cost:100 }] },
          { name:'Full Sleeve', nameTa:'முழு கை',      cost:350, empCost:60, subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 },{ name:'Lining', nameTa:'லைனிங்', cost:100 }] },
          { name:'Sleeveless',  nameTa:'கை இல்லாத',   cost:280, empCost:45, subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 },{ name:'Lining', nameTa:'லைனிங்', cost:100 }] },
          { name:'Backless',    nameTa:'முதுகில்லாத',  cost:400, empCost:70, subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 },{ name:'Lining', nameTa:'லைனிங்', cost:150 }] },
        ],
      },
      {
        name:'Chudi', nameTa:'சூடிதார்',
        measurements:[
          { key:'length',   label:'Length',   labelTa:'நீளம்',     required:true  },
          { key:'chest',    label:'Chest',    labelTa:'மார்பு',    required:true  },
          { key:'waist',    label:'Waist',    labelTa:'இடுப்பு',   required:true  },
          { key:'hip',      label:'Hip',      labelTa:'இடுப்பகல்', required:true  },
          { key:'shoulder', label:'Shoulder', labelTa:'தோள்',      required:false },
          { key:'sleeve',   label:'Sleeve',   labelTa:'கை நீளம்',  required:false },
        ],
        types:[
          { name:'Straight Cut', nameTa:'நேர் வெட்டு', cost:400, empCost:60, subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 },{ name:'Lining', nameTa:'லைனிங்', cost:100 }] },
          { name:'Anarkali',     nameTa:'அனார்கலி',    cost:500, empCost:80, subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 },{ name:'Lining', nameTa:'லைனிங்', cost:150 }] },
        ],
      },
      {
        name:'Saree Blouse', nameTa:'புடவை ரவிக்கை',
        measurements:[
          { key:'length',   label:'Length',   labelTa:'நீளம்',    required:true  },
          { key:'chest',    label:'Chest',    labelTa:'மார்பு',   required:true  },
          { key:'shoulder', label:'Shoulder', labelTa:'தோள்',     required:false },
          { key:'sleeve',   label:'Sleeve',   labelTa:'கை நீளம்', required:false },
          { key:'neck',     label:'Neck',     labelTa:'கழுத்து',  required:false },
        ],
        types:[
          { name:'Plain',    nameTa:'சாதா',     cost:350, empCost:50,  subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 },{ name:'Lining', nameTa:'லைனிங்', cost:100 }] },
          { name:'Designer', nameTa:'டிசைனர்',  cost:600, empCost:100, subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 },{ name:'Heavy Work', nameTa:'கனமான வேலை', cost:200 }] },
        ],
      },
      {
        name:'Pant', nameTa:'பேன்ட்',
        measurements:[
          { key:'length', label:'Length', labelTa:'நீளம்',     required:true  },
          { key:'waist',  label:'Waist',  labelTa:'இடுப்பு',   required:true  },
          { key:'hip',    label:'Hip',    labelTa:'இடுப்பகல்', required:true  },
          { key:'inseam', label:'Inseam', labelTa:'உள் தையல்', required:false },
          { key:'thigh',  label:'Thigh',  labelTa:'தொடை',      required:false },
        ],
        types:[
          { name:'Regular', nameTa:'சாதாரண',   cost:450, empCost:70, subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 }] },
          { name:'Formal',  nameTa:'ஃபார்மல்', cost:550, empCost:90, subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 }] },
        ],
      },
      {
        name:'Lehenga', nameTa:'லேஹங்கா',
        measurements:[
          { key:'length', label:'Length', labelTa:'நீளம்',     required:true },
          { key:'waist',  label:'Waist',  labelTa:'இடுப்பு',   required:true },
          { key:'hip',    label:'Hip',    labelTa:'இடுப்பகல்', required:true },
        ],
        types:[
          { name:'Simple', nameTa:'எளிய',    cost:800,  empCost:120, subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 },{ name:'Lining', nameTa:'லைனிங்', cost:200 }] },
          { name:'Bridal', nameTa:'மணமகள்',  cost:1500, empCost:250, subtypes:[{ name:'Heavy Work', nameTa:'கனமான வேலை', cost:0 }] },
        ],
      },
      {
        name:'Shirt', nameTa:'சட்டை',
        measurements:[
          { key:'length',   label:'Length',   labelTa:'நீளம்',    required:true  },
          { key:'chest',    label:'Chest',    labelTa:'மார்பு',   required:true  },
          { key:'shoulder', label:'Shoulder', labelTa:'தோள்',     required:false },
          { key:'sleeve',   label:'Sleeve',   labelTa:'கை நீளம்', required:false },
          { key:'neck',     label:'Neck',     labelTa:'கழுத்து',  required:false },
        ],
        types:[
          { name:'Casual', nameTa:'கேஷுவல்',  cost:400, empCost:60, subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 }] },
          { name:'Formal', nameTa:'ஃபார்மல்', cost:500, empCost:80, subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 }] },
        ],
      },
      {
        name:'Kids Dress', nameTa:'குழந்தை உடை',
        measurements:[
          { key:'length', label:'Length', labelTa:'நீளம்',   required:true  },
          { key:'chest',  label:'Chest',  labelTa:'மார்பு',  required:true  },
          { key:'waist',  label:'Waist',  labelTa:'இடுப்பு', required:false },
        ],
        types:[
          { name:'Frock',      nameTa:'ஃப்ராக்',     cost:250, empCost:40, subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 }] },
          { name:'Party Wear', nameTa:'பார்ட்டி உடை', cost:400, empCost:60, subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 }] },
        ],
      },
    ]

    await ClothType.insertMany(defaults)
    const count = await ClothType.countDocuments()
    res.json({ success:true, message:`Re-seeded ${count} cloth types` })
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
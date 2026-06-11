const AlterationOption = require('../models/AlterationOption')

const defaults = [
  { name:'Tight Fitting',     description:'Make the garment more fitted to the body',     extraCost:50  },
  { name:'Loose Fitting',     description:'Make the garment more relaxed and loose',       extraCost:50  },
  { name:'Shorten Sleeve',    description:'Reduce the sleeve length',                      extraCost:30  },
  { name:'Lengthen Sleeve',   description:'Extend the sleeve length',                     extraCost:40  },
  { name:'Shorten Length',    description:'Reduce the overall length of the garment',      extraCost:40  },
  { name:'Lengthen',          description:'Extend the overall length',                    extraCost:50  },
  { name:'Tighten Waist',     description:'Take in the waist for a better fit',           extraCost:60  },
  { name:'Expand Waist',      description:'Let out the waist for more room',              extraCost:60  },
  { name:'Add Lining',        description:'Add inner lining to the garment',              extraCost:150 },
  { name:'Add Padding',       description:'Add shoulder or chest padding',                extraCost:100 },
  { name:'Embroidery',        description:'Add embroidery work as specified',              extraCost:200 },
  { name:'Adjust Neckline',   description:'Modify the neckline shape or depth',           extraCost:80  },
  { name:'Custom Alteration', description:'Special alteration as described in notes',     extraCost:0   },
]

const seedAlterationOptions = async () => {
  try {
    const existing = await AlterationOption.countDocuments()
    if (existing > 0) {
      console.log('✅ Alteration options already seeded')
      return
    }
    await AlterationOption.insertMany(defaults)
    console.log('✅ Default alteration options seeded')
  } catch (e) {
    console.error('❌ Alteration seed error:', e.message)
  }
}

module.exports = seedAlterationOptions
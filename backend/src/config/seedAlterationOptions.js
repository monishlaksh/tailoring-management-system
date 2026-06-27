const AlterationOption = require('../models/AlterationOption')

// Cloth-type specific alterations
const defaults = [

  // ── Blouse specific ─────────────────────────────────────────
  { name:'Adjust Neckline',   description:'Modify the neckline shape or depth',        extraCost:80,  clothTypes:['Blouse','Saree Blouse'] },
  { name:'Add Lining',        description:'Add inner lining to the garment',           extraCost:150, clothTypes:['Blouse','Saree Blouse','Lehenga','Chudi'] },
  { name:'Add Padding',       description:'Add shoulder or chest padding',             extraCost:100, clothTypes:['Blouse','Saree Blouse','Shirt'] },
  { name:'Backless Design',   description:'Make the back open or backless style',      extraCost:120, clothTypes:['Blouse','Saree Blouse'] },
  { name:'Add Sleeves',       description:'Add sleeves to sleeveless design',          extraCost:100, clothTypes:['Blouse','Saree Blouse'] },
  { name:'Remove Sleeves',    description:'Convert to sleeveless',                     extraCost:60,  clothTypes:['Blouse','Saree Blouse','Shirt'] },

  // ── Pant / Trouser specific ──────────────────────────────────
  { name:'Tighten Waist',     description:'Take in the waist for a better fit',        extraCost:60,  clothTypes:['Pant','Chudi'] },
  { name:'Expand Waist',      description:'Let out the waist for more room',           extraCost:60,  clothTypes:['Pant','Chudi'] },
  { name:'Taper Leg',         description:'Make the leg narrower towards the bottom',  extraCost:80,  clothTypes:['Pant'] },
  { name:'Widen Leg',         description:'Make the leg wider',                        extraCost:80,  clothTypes:['Pant'] },
  { name:'Add Cuff',          description:'Add folded cuff at the bottom',             extraCost:50,  clothTypes:['Pant'] },
  { name:'Shorten Inseam',    description:'Reduce the inseam length',                  extraCost:40,  clothTypes:['Pant'] },

  // ── Shirt specific ───────────────────────────────────────────
  { name:'Add Pocket',        description:'Add a chest or side pocket',                extraCost:60,  clothTypes:['Shirt'] },
  { name:'Collar Adjustment', description:'Modify collar shape or size',               extraCost:70,  clothTypes:['Shirt'] },

  // ── Lehenga / Chudi specific ─────────────────────────────────
  { name:'Add Embroidery',    description:'Add embroidery work as specified',          extraCost:200, clothTypes:['Lehenga','Blouse','Saree Blouse'] },
  { name:'Add Dupatta',       description:'Attach or add dupatta',                     extraCost:150, clothTypes:['Lehenga','Chudi'] },
  { name:'Flare Adjustment',  description:'Adjust the flare of the skirt/lehenga',    extraCost:100, clothTypes:['Lehenga'] },

  // ── Common across multiple types ─────────────────────────────
  { name:'Tight Fitting',     description:'Make the garment more fitted to the body', extraCost:50,  clothTypes:['Blouse','Saree Blouse','Shirt','Chudi','Lehenga','Kids Dress','Custom Dress'] },
  { name:'Loose Fitting',     description:'Make the garment more relaxed and loose',  extraCost:50,  clothTypes:['Blouse','Saree Blouse','Shirt','Chudi','Lehenga','Kids Dress','Custom Dress'] },
  { name:'Shorten Length',    description:'Reduce the overall length of the garment', extraCost:40,  clothTypes:['Blouse','Saree Blouse','Shirt','Chudi','Lehenga','Kids Dress','Custom Dress','Pant'] },
  { name:'Lengthen',          description:'Extend the overall length',                extraCost:50,  clothTypes:['Blouse','Saree Blouse','Shirt','Chudi','Lehenga','Kids Dress','Custom Dress','Pant'] },
  { name:'Shorten Sleeve',    description:'Reduce the sleeve length',                 extraCost:30,  clothTypes:['Blouse','Saree Blouse','Shirt','Chudi','Custom Dress'] },
  { name:'Lengthen Sleeve',   description:'Extend the sleeve length',                 extraCost:40,  clothTypes:['Blouse','Saree Blouse','Shirt','Chudi','Custom Dress'] },
  { name:'Custom Alteration', description:'Special alteration as described in notes', extraCost:0,   clothTypes:[] }, // empty = all types
]

const seedAlterationOptions = async () => {
  try {
    const existing = await AlterationOption.countDocuments()
    if (existing > 0) {
      console.log('✅ Alteration options already seeded')
      return
    }
    await AlterationOption.insertMany(defaults)
    console.log('✅ Alteration options seeded with cloth-type tags')
  } catch (e) {
    console.error('❌ Alteration seed error:', e.message)
  }
}

module.exports = seedAlterationOptions
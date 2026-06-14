const ClothType = require('../models/ClothType')

const defaults = [
  {
    name: 'Blouse',
    types: [
      { name:'Half Sleeve',  subtypes:[{ name:'Normal', cost:300 },{ name:'Lining', cost:450 }] },
      { name:'Full Sleeve',  subtypes:[{ name:'Normal', cost:320 },{ name:'Lining', cost:470 }] },
      { name:'Backless',     subtypes:[{ name:'Normal', cost:380 },{ name:'Lining', cost:520 }] },
      { name:'Sleeveless',   subtypes:[{ name:'Normal', cost:280 },{ name:'Lining', cost:420 }] },
    ],
  },
  {
    name: 'Chudi',
    types: [
      { name:'Straight Cut', subtypes:[{ name:'Normal', cost:400 },{ name:'Lining', cost:550 }] },
      { name:'Anarkali',     subtypes:[{ name:'Normal', cost:500 },{ name:'Lining', cost:650 }] },
    ],
  },
  {
    name: 'Saree Blouse',
    types: [
      { name:'Plain',        subtypes:[{ name:'Normal', cost:350 },{ name:'Lining', cost:500 }] },
      { name:'Designer',     subtypes:[{ name:'Normal', cost:500 },{ name:'Heavy Work', cost:700 }] },
    ],
  },
  {
    name: 'Shirt',
    types: [
      { name:'Casual',       subtypes:[{ name:'Normal', cost:400 }] },
      { name:'Formal',       subtypes:[{ name:'Normal', cost:500 }] },
    ],
  },
  {
    name: 'Pant',
    types: [
      { name:'Regular',      subtypes:[{ name:'Normal', cost:450 }] },
      { name:'Formal',       subtypes:[{ name:'Normal', cost:550 }] },
    ],
  },
  {
    name: 'Lehenga',
    types: [
      { name:'Simple',       subtypes:[{ name:'Normal', cost:800 },{ name:'Lining', cost:1000 }] },
      { name:'Bridal',       subtypes:[{ name:'Heavy Work', cost:1500 }] },
    ],
  },
  {
    name: 'Kids Dress',
    types: [
      { name:'Frock',        subtypes:[{ name:'Normal', cost:250 }] },
      { name:'Party Wear',   subtypes:[{ name:'Normal', cost:400 }] },
    ],
  },
  {
    name: 'Custom Dress',
    types: [
      { name:'Custom',       subtypes:[{ name:'Normal', cost:500 },{ name:'Designer', cost:800 }] },
    ],
  },
]

const seedClothTypes = async () => {
  try {
    const existing = await ClothType.countDocuments()
    if (existing > 0) {
      console.log('✅ Cloth types already seeded')
      return
    }
    await ClothType.insertMany(defaults)
    console.log('✅ Cloth types seeded with 3-level hierarchy')
  } catch (e) {
    console.error('❌ Seed error:', e.message)
  }
}

module.exports = seedClothTypes
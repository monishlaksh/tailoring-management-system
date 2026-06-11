const ClothType = require('../models/ClothType')

const defaultClothTypes = [
  {
    name: 'Blouse',
    subtypes: [
      { name: 'Normal', cost: 300 },
      { name: 'Lining', cost: 450 },
      { name: 'Designer', cost: 600 },
    ],
  },
  {
    name: 'Chudi',
    subtypes: [
      { name: 'Normal', cost: 400 },
      { name: 'Lining', cost: 550 },
    ],
  },
  {
    name: 'Saree Blouse',
    subtypes: [
      { name: 'Normal', cost: 350 },
      { name: 'Lining', cost: 500 },
      { name: 'Heavy Work', cost: 700 },
    ],
  },
  {
    name: 'Shirt',
    subtypes: [
      { name: 'Normal', cost: 400 },
      { name: 'Formal', cost: 500 },
    ],
  },
  {
    name: 'Pant',
    subtypes: [
      { name: 'Normal', cost: 450 },
      { name: 'Formal', cost: 550 },
    ],
  },
  {
    name: 'Lehenga',
    subtypes: [
      { name: 'Normal', cost: 800 },
      { name: 'Heavy Work', cost: 1200 },
    ],
  },
  {
    name: 'Kids Dress',
    subtypes: [
      { name: 'Normal', cost: 250 },
      { name: 'Designer', cost: 400 },
    ],
  },
  {
    name: 'Custom Dress',
    subtypes: [
      { name: 'Normal', cost: 500 },
      { name: 'Designer', cost: 800 },
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
    await ClothType.insertMany(defaultClothTypes)
    console.log('✅ Default cloth types seeded successfully')
  } catch (e) {
    console.error('❌ Seed error:', e.message)
  }
}

module.exports = seedClothTypes
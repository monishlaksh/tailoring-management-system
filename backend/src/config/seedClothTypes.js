const ClothType = require('../models/ClothType')

const defaults = [
  {
    name: 'Blouse',
    nameTa: 'ரவிக்கை',
    measurements: [
      { key:'length',   label:'Length',   labelTa:'நீளம்',       required:true  },
      { key:'chest',    label:'Chest',    labelTa:'மார்பு',      required:true  },
      { key:'waist',    label:'Waist',    labelTa:'இடுப்பு',     required:false },
      { key:'shoulder', label:'Shoulder', labelTa:'தோள்',        required:false },
      { key:'sleeve',   label:'Sleeve',   labelTa:'கை நீளம்',    required:false },
      { key:'neck',     label:'Neck',     labelTa:'கழுத்து',     required:false },
    ],
    types: [
      {
        name:'Half Sleeve', nameTa:'அரை கை', cost:300, empCost:50,
        subtypes:[
          { name:'Normal', nameTa:'சாதாரண', cost:0   },
          { name:'Lining', nameTa:'லைனிங்', cost:100 },
        ],
      },
      {
        name:'Full Sleeve', nameTa:'முழு கை', cost:350, empCost:60,
        subtypes:[
          { name:'Normal', nameTa:'சாதாரண', cost:0   },
          { name:'Lining', nameTa:'லைனிங்', cost:100 },
        ],
      },
      {
        name:'Sleeveless', nameTa:'கை இல்லாத', cost:280, empCost:45,
        subtypes:[
          { name:'Normal', nameTa:'சாதாரண', cost:0   },
          { name:'Lining', nameTa:'லைனிங்', cost:100 },
        ],
      },
      {
        name:'Backless', nameTa:'முதுகில்லாத', cost:400, empCost:70,
        subtypes:[
          { name:'Normal', nameTa:'சாதாரண', cost:0   },
          { name:'Lining', nameTa:'லைனிங்', cost:150 },
        ],
      },
    ],
  },
  {
    name: 'Chudi',
    nameTa: 'சூடிதார்',
    measurements: [
      { key:'length',   label:'Length',   labelTa:'நீளம்',    required:true  },
      { key:'chest',    label:'Chest',    labelTa:'மார்பு',   required:true  },
      { key:'waist',    label:'Waist',    labelTa:'இடுப்பு',  required:true  },
      { key:'hip',      label:'Hip',      labelTa:'இடுப்பகல்',required:true  },
      { key:'shoulder', label:'Shoulder', labelTa:'தோள்',     required:false },
      { key:'sleeve',   label:'Sleeve',   labelTa:'கை நீளம்', required:false },
    ],
    types: [
      {
        name:'Straight Cut', nameTa:'நேர் வெட்டு', cost:400, empCost:60,
        subtypes:[
          { name:'Normal', nameTa:'சாதாரண', cost:0   },
          { name:'Lining', nameTa:'லைனிங்', cost:100 },
        ],
      },
      {
        name:'Anarkali', nameTa:'அனார்கலி', cost:500, empCost:80,
        subtypes:[
          { name:'Normal', nameTa:'சாதாரண', cost:0   },
          { name:'Lining', nameTa:'லைனிங்', cost:150 },
        ],
      },
    ],
  },
  {
    name: 'Saree Blouse',
    nameTa: 'புடவை ரவிக்கை',
    measurements: [
      { key:'length',   label:'Length',   labelTa:'நீளம்',    required:true  },
      { key:'chest',    label:'Chest',    labelTa:'மார்பு',   required:true  },
      { key:'shoulder', label:'Shoulder', labelTa:'தோள்',     required:false },
      { key:'sleeve',   label:'Sleeve',   labelTa:'கை நீளம்', required:false },
      { key:'neck',     label:'Neck',     labelTa:'கழுத்து',  required:false },
    ],
    types: [
      {
        name:'Plain', nameTa:'சாதா', cost:350, empCost:50,
        subtypes:[
          { name:'Normal', nameTa:'சாதாரண', cost:0   },
          { name:'Lining', nameTa:'லைனிங்', cost:100 },
        ],
      },
      {
        name:'Designer', nameTa:'டிசைனர்', cost:600, empCost:100,
        subtypes:[
          { name:'Normal',     nameTa:'சாதாரண',   cost:0   },
          { name:'Heavy Work', nameTa:'கனமான வேலை', cost:200 },
        ],
      },
    ],
  },
  {
    name: 'Pant',
    nameTa: 'பேன்ட்',
    measurements: [
      { key:'length',  label:'Length',     labelTa:'நீளம்',    required:true  },
      { key:'waist',   label:'Waist',      labelTa:'இடுப்பு',  required:true  },
      { key:'hip',     label:'Hip',        labelTa:'இடுப்பகல்',required:true  },
      { key:'inseam',  label:'Inseam',     labelTa:'உள் தையல்',required:false },
      { key:'thigh',   label:'Thigh',      labelTa:'தொடை',     required:false },
    ],
    types: [
      {
        name:'Regular', nameTa:'சாதாரண', cost:450, empCost:70,
        subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 }],
      },
      {
        name:'Formal', nameTa:'ஃபார்மல்', cost:550, empCost:90,
        subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 }],
      },
    ],
  },
  {
    name: 'Lehenga',
    nameTa: 'லேஹங்கா',
    measurements: [
      { key:'length', label:'Length', labelTa:'நீளம்',    required:true  },
      { key:'waist',  label:'Waist',  labelTa:'இடுப்பு',  required:true  },
      { key:'hip',    label:'Hip',    labelTa:'இடுப்பகல்',required:true  },
    ],
    types: [
      {
        name:'Simple', nameTa:'எளிய', cost:800, empCost:120,
        subtypes:[
          { name:'Normal', nameTa:'சாதாரண', cost:0   },
          { name:'Lining', nameTa:'லைனிங்', cost:200 },
        ],
      },
      {
        name:'Bridal', nameTa:'மணமகள்', cost:1500, empCost:250,
        subtypes:[
          { name:'Heavy Work', nameTa:'கனமான வேலை', cost:0 },
        ],
      },
    ],
  },
  {
    name: 'Shirt',
    nameTa: 'சட்டை',
    measurements: [
      { key:'length',   label:'Length',   labelTa:'நீளம்',    required:true  },
      { key:'chest',    label:'Chest',    labelTa:'மார்பு',   required:true  },
      { key:'shoulder', label:'Shoulder', labelTa:'தோள்',     required:false },
      { key:'sleeve',   label:'Sleeve',   labelTa:'கை நீளம்', required:false },
      { key:'neck',     label:'Neck',     labelTa:'கழுத்து',  required:false },
    ],
    types: [
      {
        name:'Casual', nameTa:'கேஷுவல்', cost:400, empCost:60,
        subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 }],
      },
      {
        name:'Formal', nameTa:'ஃபார்மல்', cost:500, empCost:80,
        subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 }],
      },
    ],
  },
  {
    name: 'Kids Dress',
    nameTa: 'குழந்தை உடை',
    measurements: [
      { key:'length', label:'Length', labelTa:'நீளம்',   required:true  },
      { key:'chest',  label:'Chest',  labelTa:'மார்பு',  required:true  },
      { key:'waist',  label:'Waist',  labelTa:'இடுப்பு', required:false },
    ],
    types: [
      {
        name:'Frock', nameTa:'ஃப்ராக்', cost:250, empCost:40,
        subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 }],
      },
      {
        name:'Party Wear', nameTa:'பார்ட்டி உடை', cost:400, empCost:60,
        subtypes:[{ name:'Normal', nameTa:'சாதாரண', cost:0 }],
      },
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
    console.log('✅ Cloth types seeded with measurements, costs, Tamil names')
  } catch (e) {
    console.error('❌ Seed error:', e.message)
  }
}

module.exports = seedClothTypes
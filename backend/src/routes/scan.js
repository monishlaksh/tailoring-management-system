const express    = require('express')
const Order      = require('../models/Order')
const Allotment  = require('../models/Allotment')
const ClothType  = require('../models/ClothType')
const router     = express.Router()

router.get('/:orderID', async (req, res) => {
  try {
    const cleanID = req.params.orderID.trim().toUpperCase()
    const stage   = (req.query.stage || 'general').trim().toLowerCase()

    console.log(`[SCAN] orderID=${cleanID} stage=${stage}`)

    let order = await Order.findOne({ orderID: cleanID }).lean()

    if (!order) {
      order = await Order.findOne({
        orderID: { $regex: new RegExp(`^${cleanID}$`, 'i') }
      }).lean()
    }

    if (!order) {
      console.log(`[SCAN] Not found: "${cleanID}"`)
      return res.status(404).json({
        success: false,
        message: `Order "${cleanID}" not found`,
      })
    }

    console.log(`[SCAN] Found: ${order.orderID}`)

    const allotment = await Allotment.findOne({ orderID: order.orderID }).lean()

    // Get Tamil name for cloth type
    const clothTypeName = (order.clothType || '').split(' - ')[0].trim()
    const ctDoc = await ClothType.findOne({ name: clothTypeName }).lean()

    // After fetching ctDoc, include measurement images in response:
const measurementImages = {}
if (ctDoc?.measurements) {
  ctDoc.measurements.forEach(m => {
    if (m.image) measurementImages[m.key] = m.image
  })
}

// Add before building response:
let subtypeImage = ''
const parts = (order.clothType || '').split(' - ')
if (ctDoc && parts[1] && parts[2]) {
  const typeDoc = ctDoc.types?.find(t => t.name === parts[1]?.trim())
  const subDoc  = typeDoc?.subtypes?.find(s => s.name === parts[2]?.trim())
  subtypeImage  = subDoc?.image || ''
}

const response = {
  success:           true,
  orderID:           order.orderID,
  clothType:         order.clothType,
  clothTypeTa:       ctDoc?.nameTa || '',
  subtypeImage:      subtypeImage || '',  // ← subtype image
  quantity:          order.quantity,
  measurements:      measurements,
  measurementImages,                      // ← guide images per key
      fabricNotes:  order.fabricNotes  || '',
      voiceNote:    order.voiceNote    || { data:'', mimeType:'audio/webm', duration:0 },
      stage,
      stageInfo: (allotment && stage !== 'general' && allotment[stage])
        ? {
            status:     allotment[stage].status     || 'not_assigned',
            employeeID: allotment[stage].employeeID || '',
            notes:      allotment[stage].notes      || '',
          }
        : { status: 'not_assigned', employeeID: '', notes: '' },
      allStages: allotment
        ? {
            cutting:   { status: allotment.cutting?.status   || 'not_assigned' },
            stitching: { status: allotment.stitching?.status || 'not_assigned' },
            finishing: { status: allotment.finishing?.status || 'not_assigned' },
          }
        : {
            cutting:   { status: 'not_assigned' },
            stitching: { status: 'not_assigned' },
            finishing: { status: 'not_assigned' },
          },
    }

    if (stage === 'stitching') {
      response.alteration = order.alteration || { required: false }
    }

    res.json(response)
  } catch (e) {
    console.error('[SCAN] Error:', e.message)
    res.status(500).json({ success: false, message: e.message })
  }
})

module.exports = router
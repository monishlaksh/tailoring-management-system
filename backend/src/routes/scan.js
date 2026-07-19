const express    = require('express')
const Order      = require('../models/Order')
const Allotment  = require('../models/Allotment')
const ClothType  = require('../models/ClothType')
const router     = express.Router()

// PUBLIC — no auth required
router.get('/:orderID', async (req, res) => {
  try {
    const cleanID = req.params.orderID.trim().toUpperCase()
    console.log('[SCAN] Looking up:', cleanID)

    // Find order
    const order = await Order.findOne({ orderID: cleanID }).lean()
    if (!order) {
      console.log('[SCAN] Not found:', cleanID)
      return res.status(404).json({
        success: false,
        message: `Order "${cleanID}" not found`,
      })
    }

    // Find allotment
    const allotment = await Allotment.findOne({ orderID: cleanID }).lean()

    // Get cloth type Tamil names + measurement images
    const parts         = (order.clothType || '').split(' - ')
    const clothTypeName = parts[0]?.trim() || ''
    let clothTypeTa     = ''
    let typeImage       = ''
    let measurementImages  = {}
    let measurementLabels  = {}

    if (clothTypeName) {
      const ctDoc = await ClothType.findOne({ name: clothTypeName }).lean()
      if (ctDoc) {
        clothTypeTa = ctDoc.nameTa || ''

        // Measurement labels + images
        ;(ctDoc.measurements || []).forEach(m => {
          measurementImages[m.key] = m.image || ''
          measurementLabels[m.key] = {
            label:   m.label,
            labelTa: m.labelTa || '',
          }
        })

        // Type image
        const typeName = parts[1]?.trim()
        if (typeName) {
          const typeDoc = ctDoc.types?.find(
            t => t.name.toLowerCase() === typeName.toLowerCase()
          )
          typeImage = typeDoc?.image || ''
        }
      }
    }

    // Serialize measurements Map → plain object
    const measurements = order.measurements instanceof Map
      ? Object.fromEntries(order.measurements)
      : (order.measurements || {})

    // Build allStages
    const allStages = allotment
      ? {
          cutting:   { status: allotment.cutting?.status   || 'not_assigned' },
          stitching: { status: allotment.stitching?.status || 'not_assigned' },
          finishing: { status: allotment.finishing?.status || 'not_assigned' },
        }
      : {
          cutting:   { status: 'not_assigned' },
          stitching: { status: 'not_assigned' },
          finishing: { status: 'not_assigned' },
        }

    res.json({
      success:          true,
      orderID:          order.orderID,
      clothType:        order.clothType,
      clothTypeTa,
      typeImage,
      quantity:         order.quantity   || 1,
      measurements,
      measurementImages,
      measurementLabels,
      fabricNotes:      order.fabricNotes || '',
      alteration:       order.alteration  || { required: false },
      voiceNote:        order.voiceNote   || { data: '', mimeType: 'audio/webm', duration: 0 },
      allStages,
    })
  } catch (e) {
    console.error('[SCAN]', e.message)
    res.status(500).json({ success: false, message: e.message })
  }
})

module.exports = router
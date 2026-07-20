const express   = require('express')
const Order     = require('../models/Order')
const Allotment = require('../models/Allotment')
const ClothType = require('../models/ClothType')
const router    = express.Router()

router.get('/:orderID', async (req, res) => {
  try {
    const cleanID = req.params.orderID.trim().toUpperCase()
    console.log('[SCAN ROUTE] orderID:', cleanID)

    const order = await Order.findOne({ orderID: cleanID }).lean()
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order "${cleanID}" not found`,
      })
    }

    const allotment = await Allotment.findOne({ orderID: cleanID }).lean()

    // Cloth type info
    const parts         = (order.clothType || '').split(' - ')
    const clothTypeName = parts[0]?.trim() || ''
    let clothTypeTa     = ''
    let typeImage       = ''
    let measurementImages = {}
    let measurementLabels = {}

    if (clothTypeName) {
      const ctDoc = await ClothType.findOne({ name: clothTypeName }).lean()
      if (ctDoc) {
        clothTypeTa = ctDoc.nameTa || ''
        ;(ctDoc.measurements || []).forEach(m => {
          if (m.image) measurementImages[m.key] = m.image
          measurementLabels[m.key] = {
            label:   m.label   || m.key,
            labelTa: m.labelTa || '',
          }
        })
        const typeName = parts[1]?.trim()
        if (typeName) {
          const typeDoc = ctDoc.types?.find(
            t => t.name.toLowerCase() === typeName.toLowerCase()
          )
          typeImage = typeDoc?.image || ''
        }
      }
    }

    // Serialize measurements
    const measurements = order.measurements instanceof Map
      ? Object.fromEntries(order.measurements)
      : (order.measurements || {})

    const allStages = {
      cutting:   { status: allotment?.cutting?.status   || 'not_assigned' },
      stitching: { status: allotment?.stitching?.status || 'not_assigned' },
      finishing: { status: allotment?.finishing?.status || 'not_assigned' },
    }

    return res.json({
      success:           true,
      orderID:           order.orderID,
      clothType:         order.clothType,
      clothTypeTa,
      typeImage,
      quantity:          order.quantity    || 1,
      measurements,
      measurementImages,
      measurementLabels,
      fabricNotes:       order.fabricNotes || '',
      specialInstructions: order.specialInstructions || '',
      alteration:        order.alteration  || { required: false },
      voiceNote:         order.voiceNote   || { data:'', mimeType:'audio/webm', duration:0 },
      allStages,
    })
  } catch (e) {
    console.error('[SCAN]', e.message, e.stack)
    return res.status(500).json({ success: false, message: e.message })
  }
})

module.exports = router
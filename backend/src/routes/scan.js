const express  = require('express')
const mongoose = require('mongoose')
const router   = express.Router()

router.get('/:orderID', async (req, res) => {
  // Always return JSON — never HTML
  res.setHeader('Content-Type', 'application/json')

  try {
    const cleanID = (req.params.orderID || '').trim().toUpperCase()

    if (!cleanID) {
      return res.status(400).json({ success:false, message:'No order ID provided' })
    }

    // Use raw collection queries — avoids any model import issues
    const db = mongoose.connection.db

    if (!db) {
      return res.status(500).json({ success:false, message:'Database not connected' })
    }

    // Find order
    const order = await db.collection('orders').findOne({ orderID: cleanID })
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order "${cleanID}" not found`,
      })
    }

    // Find allotment (non-critical)
    let allotment = null
    try {
      allotment = await db.collection('allotments').findOne({ orderID: cleanID })
    } catch (e) { /* non-critical */ }

    // Find cloth type (non-critical)
    let clothTypeTa       = ''
    let typeImage         = ''
    let measurementImages = {}
    let measurementLabels = {}

    try {
      const parts         = (order.clothType || '').split(' - ')
      const clothTypeName = parts[0]?.trim()

      if (clothTypeName) {
        const ctDoc = await db.collection('clothtypes').findOne({
          name: clothTypeName
        })

        if (ctDoc) {
          clothTypeTa = ctDoc.nameTa || ''

          // Measurement labels + images
          ;(ctDoc.measurements || []).forEach(m => {
            if (m.image) measurementImages[m.key] = m.image
            measurementLabels[m.key] = {
              label:   m.label   || m.key,
              labelTa: m.labelTa || '',
            }
          })

          // Type image
          const typeName = parts[1]?.trim()
          if (typeName && ctDoc.types) {
            const typeDoc = ctDoc.types.find(
              t => (t.name || '').toLowerCase() === typeName.toLowerCase()
            )
            typeImage = typeDoc?.image || ''
          }
        }
      }
    } catch (e) {
      console.error('[SCAN] cloth type lookup error:', e.message)
    }

    // Serialize measurements — handle Map, plain object, or BSON
    let measurements = {}
    try {
      if (order.measurements) {
        if (order.measurements instanceof Map) {
          measurements = Object.fromEntries(order.measurements)
        } else if (typeof order.measurements === 'object') {
          // Filter out MongoDB internal fields
          Object.entries(order.measurements).forEach(([k, v]) => {
            if (!k.startsWith('$') && !k.startsWith('_') && v) {
              measurements[k] = v
            }
          })
        }
      }
    } catch (e) {
      console.error('[SCAN] measurements parse error:', e.message)
    }

    // Stage statuses
    const allStages = {
      cutting:   { status: allotment?.cutting?.status   || 'not_assigned' },
      stitching: { status: allotment?.stitching?.status || 'not_assigned' },
      finishing: { status: allotment?.finishing?.status || 'not_assigned' },
    }

    return res.json({
      success:             true,
      orderID:             order.orderID,
      clothType:           order.clothType            || '',
      clothTypeTa,
      typeImage,
      quantity:            order.quantity             || 1,
      measurements,
      measurementImages,
      measurementLabels,
      fabricNotes:         order.fabricNotes          || '',
      specialInstructions: order.specialInstructions  || '',
      alteration:          order.alteration           || { required: false },
      voiceNote:           order.voiceNote            || { data:'', mimeType:'audio/webm', duration:0 },
      allStages,
    })

  } catch (e) {
    console.error('[SCAN] Fatal error:', e.message, e.stack)
    return res.status(500).json({
      success: false,
      message: e.message || 'Server error',
    })
  }
})

module.exports = router
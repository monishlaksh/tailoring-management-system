const express   = require('express')
const Order     = require('../models/Order')
const Allotment = require('../models/Allotment')
const router    = express.Router()

router.get('/:orderID', async (req, res) => {
  try {
    const cleanID = req.params.orderID.trim().toUpperCase()
    const stage   = (req.query.stage || 'general').trim().toLowerCase()

    console.log(`[SCAN] orderID=${cleanID} stage=${stage}`)

    // Try exact match first
    let order = await Order.findOne({ orderID: cleanID }).lean()

    // Try case-insensitive if exact fails
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

    const allotment = await Allotment.findOne({
      orderID: order.orderID
    }).lean()

    const response = {
      success:      true,
      orderID:      order.orderID,
      clothType:    order.clothType,
      quantity:     order.quantity,
      measurements: order.measurements || {},
      fabricNotes:  order.fabricNotes  || '',
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
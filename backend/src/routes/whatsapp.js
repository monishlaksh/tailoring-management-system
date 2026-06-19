const express  = require('express')
const Customer = require('../models/Customer')
const { sendOfferWhatsApp, sendBroadcastWhatsApp } = require('../services/whatsappService')
const { protect } = require('../middleware/auth')
const router   = express.Router()

// POST send offer to all customers
router.post('/offer', protect, async (req, res) => {
  try {
    const { offerName, percentage } = req.body
    if (!offerName || !percentage)
      return res.status(400).json({ success:false, message:'Offer name and percentage required' })

    const customers = await Customer.find({
      isActive: true,
      phone:    { $exists:true, $ne:'' },
    }).select('name phone customerID').lean()

    if (customers.length === 0)
      return res.status(400).json({ success:false, message:'No customers found' })

    let sent = 0, failed = 0
    const errors = []

    for (const c of customers) {
      const result = await sendOfferWhatsApp(c.phone, offerName, percentage)
      if (result.success) sent++
      else { failed++; errors.push(`${c.name}: ${result.message}`) }
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 200))
    }

    res.json({
      success:   true,
      message:   `Offer sent: ${sent} success, ${failed} failed`,
      sent, failed, errors,
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST send custom message to all customers
router.post('/broadcast', protect, async (req, res) => {
  try {
    const { message } = req.body
    if (!message?.trim())
      return res.status(400).json({ success:false, message:'Message is required' })

    const customers = await Customer.find({
      isActive: true,
      phone:    { $exists:true, $ne:'' },
    }).select('name phone customerID').lean()

    if (customers.length === 0)
      return res.status(400).json({ success:false, message:'No customers found' })

    let sent = 0, failed = 0
    const errors = []

    for (const c of customers) {
      const result = await sendBroadcastWhatsApp(c.phone, message.trim())
      if (result.success) sent++
      else { failed++; errors.push(`${c.name}: ${result.message}`) }
      await new Promise(r => setTimeout(r, 200))
    }

    res.json({
      success:   true,
      message:   `Message sent: ${sent} success, ${failed} failed`,
      sent, failed, errors,
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// POST send WhatsApp to single customer (manual resend)
router.post('/resend-order', protect, async (req, res) => {
  try {
    const { customerName, customerPhone, orderID, clothType } = req.body
    const { sendOrderCompleteWhatsApp } = require('../services/whatsappService')
    const result = await sendOrderCompleteWhatsApp(customerName, customerPhone, orderID, clothType)
    if (result.success) {
      res.json({ success:true, message:'WhatsApp sent!' })
    } else {
      res.status(500).json({ success:false, message:result.message })
    }
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

module.exports = router
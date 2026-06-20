const express  = require('express')
const Customer = require('../models/Customer')
const { protect } = require('../middleware/auth')
const router   = express.Router()

// ── Helper: send WhatsApp message ────────────────────────────
const sendWA = async (toPhone, message) => {
  const token   = process.env.WHATSAPP_TOKEN
  const phoneID = process.env.WHATSAPP_PHONE_ID

  if (!token || !phoneID) {
    const msg = `WHATSAPP_TOKEN=${token?'SET':'MISSING'}, WHATSAPP_PHONE_ID=${phoneID?'SET':'MISSING'}`
    console.error('❌ WhatsApp not configured:', msg)
    return { success:false, message:`Not configured: ${msg}` }
  }

  // Clean phone number — digits only, add 91 prefix if missing
  const digits    = String(toPhone).replace(/\D/g, '')
  const formatted = digits.startsWith('91') ? digits : `91${digits}`

  console.log(`[WA] Sending to: ${formatted}`)
  console.log(`[WA] Message: ${message.substring(0,50)}...`)

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneID}/messages`,
      {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to:                formatted,
          type:              'text',
          text:              { body: message },
        }),
      }
    )

    const text = await res.text()
    console.log(`[WA] Response status: ${res.status}`)
    console.log(`[WA] Response body: ${text}`)

    let data
    try { data = JSON.parse(text) }
    catch { return { success:false, message:`Invalid response: ${text}` } }

    if (data.messages && data.messages.length > 0) {
      console.log(`✅ WhatsApp sent to ${formatted}, ID: ${data.messages[0].id}`)
      return { success:true, messageId:data.messages[0].id }
    } else {
      const errMsg = data.error?.message || JSON.stringify(data)
      console.error(`❌ WhatsApp API error: ${errMsg}`)
      return { success:false, message:errMsg, rawResponse:data }
    }
  } catch (e) {
    console.error(`❌ WhatsApp fetch error: ${e.message}`)
    return { success:false, message:e.message }
  }
}

// ── TEST route — call this to verify API works ───────────────
// GET /api/whatsapp/test?phone=919876543210
router.get('/test', protect, async (req, res) => {
  const phone = req.query.phone || process.env.TEST_PHONE
  if (!phone) {
    return res.json({
      success:   false,
      message:   'Pass ?phone=919876543210 in query',
      token_set:   !!process.env.WHATSAPP_TOKEN,
      phoneid_set: !!process.env.WHATSAPP_PHONE_ID,
    })
  }
  const result = await sendWA(phone, '✂️ Test message from Al-Ameen Tailors. If you received this, WhatsApp API is working!')
  res.json({ ...result, phone_used:phone })
})

// ── POST send offer to all customers ─────────────────────────
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
      const msg =
        `🏷️ *Al-Ameen Tailors — Special Offer!*\n\n` +
        `*${offerName}*\n` +
        `Get *${percentage}% OFF* on your next order!\n\n` +
        `Limited time offer. Visit us today! ✂️`

      const result = await sendWA(c.phone, msg)
      if (result.success) sent++
      else { failed++; errors.push(`${c.name} (${c.phone}): ${result.message}`) }

      // 200ms delay between messages to avoid rate limiting
      await new Promise(r => setTimeout(r, 200))
    }

    res.json({
      success: true,
      message: `Offer sent: ${sent} delivered, ${failed} failed`,
      sent, failed, errors,
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// ── POST send custom broadcast ────────────────────────────────
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
      const msg = `✂️ *Al-Ameen Tailors*\n\n${message.trim()}`
      const result = await sendWA(c.phone, msg)
      if (result.success) sent++
      else { failed++; errors.push(`${c.name}: ${result.message}`) }
      await new Promise(r => setTimeout(r, 200))
    }

    res.json({
      success: true,
      message: `Message sent: ${sent} delivered, ${failed} failed`,
      sent, failed, errors,
    })
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// ── POST resend order complete to specific customer ───────────
router.post('/resend-order', protect, async (req, res) => {
  try {
    const { customerName, customerPhone, orderID, clothType } = req.body
    if (!customerPhone)
      return res.status(400).json({ success:false, message:'customerPhone required' })

    const msg =
      `🎉 *Al-Ameen Tailors*\n\n` +
      `Dear ${customerName},\n\n` +
      `Your order *${orderID}* (${clothType}) is *Ready for Delivery!* ✅\n\n` +
      `Please visit our shop to collect your order.\n\n` +
      `Thank you for choosing Al-Ameen Tailors! ✂️`

    const result = await sendWA(customerPhone, msg)
    res.json(result)
  } catch (e) {
    res.status(500).json({ success:false, message:e.message })
  }
})

// Export sendWA for use in allotment route
module.exports = { router, sendWA }
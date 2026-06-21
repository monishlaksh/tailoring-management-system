const express  = require('express')
const Customer = require('../models/Customer')
const { protect } = require('../middleware/auth')
const router   = express.Router()

// ── Core WhatsApp sender function ────────────────────────────
const sendWA = async (toPhone, message) => {
  const token   = process.env.WHATSAPP_TOKEN
  const phoneID = process.env.WHATSAPP_PHONE_ID

  if (!token || !phoneID) {
    console.error('❌ WhatsApp env missing:',
      `TOKEN=${token?'SET':'MISSING'} PHONE_ID=${phoneID?'SET':'MISSING'}`)
    return { success:false, message:'WhatsApp not configured' }
  }

  const digits    = String(toPhone).replace(/\D/g, '')
  const formatted = digits.startsWith('91') ? digits : `91${digits}`

  console.log(`[WA] Sending to: ${formatted}`)

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
    console.log(`[WA] Status: ${res.status} Response: ${text}`)

    let data
    try { data = JSON.parse(text) }
    catch { return { success:false, message:`Invalid response: ${text}` } }

    if (data.messages?.[0]?.id) {
      console.log(`✅ WhatsApp sent. ID: ${data.messages[0].id}`)
      return { success:true, messageId:data.messages[0].id }
    } else {
      const errMsg = data.error?.message || JSON.stringify(data)
      console.error(`❌ WhatsApp error: ${errMsg}`)
      return { success:false, message:errMsg, error_code:data.error?.code, raw:data }
    }
  } catch (e) {
    console.error(`❌ WhatsApp fetch error: ${e.message}`)
    return { success:false, message:e.message }
  }
}

// ── TEST route — public, no auth ─────────────────────────────
router.get('/test', async (req, res) => {
  const tokenSet   = !!process.env.WHATSAPP_TOKEN
  const phoneIDSet = !!process.env.WHATSAPP_PHONE_ID

  if (!tokenSet || !phoneIDSet) {
    return res.json({
      success:           false,
      message:           'WhatsApp environment variables missing',
      WHATSAPP_TOKEN:    tokenSet   ? '✅ SET' : '❌ NOT SET',
      WHATSAPP_PHONE_ID: phoneIDSet ? '✅ SET' : '❌ NOT SET',
    })
  }

  const phone = req.query.phone
  if (!phone) {
    return res.json({
      success:           false,
      message:           'Add ?phone=919876543210 to test sending',
      WHATSAPP_TOKEN:    '✅ SET',
      WHATSAPP_PHONE_ID: '✅ SET',
    })
  }

  const result = await sendWA(
    phone,
    '✂️ Test from Al-Ameen Tailors. WhatsApp API is working!'
  )
  res.json({ ...result, phone_used: phone })
})

// ── POST send offer to all customers ─────────────────────────
router.post('/offer', protect, async (req, res) => {
  try {
    const { offerName, percentage } = req.body
    if (!offerName || !percentage)
      return res.status(400).json({
        success: false,
        message: 'Offer name and percentage required',
      })

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

      // Delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300))
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

// ── POST send broadcast message to all customers ─────────────
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
      await new Promise(r => setTimeout(r, 300))
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

// Export both router and sendWA function
module.exports = { router, sendWA }
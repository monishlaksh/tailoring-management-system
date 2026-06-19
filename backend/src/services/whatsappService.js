const sendWhatsApp = async (toPhone, message) => {
  try {
    const token   = process.env.WHATSAPP_TOKEN
    const phoneID = process.env.WHATSAPP_PHONE_ID

    if (!token || !phoneID) {
      console.log('⚠️ WhatsApp not configured — skipping')
      return { success: false, message: 'WhatsApp not configured' }
    }

    // Format: remove all non-digits, add 91 if not present
    const digits    = toPhone.replace(/\D/g, '')
    const formatted = digits.startsWith('91') ? digits : `91${digits}`

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

    const data = await res.json()

    if (data.messages && data.messages.length > 0) {
      console.log(`✅ WhatsApp sent to ${formatted}`)
      return { success: true, data }
    } else {
      console.error('❌ WhatsApp failed:', JSON.stringify(data))
      return { success: false, message: data.error?.message || 'Unknown error' }
    }
  } catch (e) {
    console.error('❌ WhatsApp error:', e.message)
    return { success: false, message: e.message }
  }
}

// Order completion message
const sendOrderCompleteWhatsApp = async (customerName, phone, orderID, clothType) => {
  const msg =
    `🎉 *Al-Ameen Tailors*\n\n` +
    `Dear ${customerName},\n\n` +
    `Your order *${orderID}* (${clothType}) is *Ready for Delivery!* ✅\n\n` +
    `Please visit our shop to collect your order.\n\n` +
    `Thank you for choosing Al-Ameen Tailors! ✂️`
  return sendWhatsApp(phone, msg)
}

// Offer broadcast
const sendOfferWhatsApp = async (phone, offerName, percentage) => {
  const msg =
    `🏷️ *Al-Ameen Tailors — Special Offer!*\n\n` +
    `*${offerName}*\n` +
    `Get *${percentage}% OFF* on your next order!\n\n` +
    `Limited time offer. Visit us today! ✂️`
  return sendWhatsApp(phone, msg)
}

// Custom broadcast message
const sendBroadcastWhatsApp = async (phone, customMessage) => {
  const msg = `✂️ *Al-Ameen Tailors*\n\n${customMessage}`
  return sendWhatsApp(phone, msg)
}

module.exports = {
  sendWhatsApp,
  sendOrderCompleteWhatsApp,
  sendOfferWhatsApp,
  sendBroadcastWhatsApp,
}
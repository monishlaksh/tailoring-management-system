const sendWhatsApp = async (toPhone, message) => {
  try {
    const token   = process.env.WHATSAPP_TOKEN
    const phoneID = process.env.WHATSAPP_PHONE_ID

    if (!token || !phoneID) {
      console.log('⚠️ WhatsApp not configured — message skipped')
      return { success:false, message:'WhatsApp not configured' }
    }

    // Format phone number — must include country code, no + or spaces
    // e.g. 919876543210 for India +91 9876543210
    const formatted = toPhone.replace(/\D/g, '')
    const phone     = formatted.startsWith('91') ? formatted : `91${formatted}`

    const payload = {
      messaging_product: 'whatsapp',
      to:                phone,
      type:              'text',
      text:              { body: message },
    }

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneID}/messages`,
      {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    const data = await res.json()

    if (data.messages) {
      console.log(`✅ WhatsApp sent to ${phone}`)
      return { success:true, data }
    } else {
      console.error('❌ WhatsApp failed:', data.error?.message)
      return { success:false, message:data.error?.message }
    }
  } catch (e) {
    console.error('❌ WhatsApp error:', e.message)
    return { success:false, message:e.message }
  }
}

const sendOrderCompleteWhatsApp = async (customerName, customerPhone, orderID, clothType) => {
  const message =
    `🎉 *Al-Ameen Tailors*\n\n` +
    `Dear ${customerName},\n\n` +
    `Your order *${orderID}* (${clothType}) is *Ready for Delivery!* 🎊\n\n` +
    `Please visit our shop to collect your order.\n\n` +
    `Thank you for choosing Al-Ameen Tailors! ✂️`

  return sendWhatsApp(customerPhone, message)
}

module.exports = { sendWhatsApp, sendOrderCompleteWhatsApp }
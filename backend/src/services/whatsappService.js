const sendWhatsApp = async (toPhone, message) => {
  try {
    console.log('\n========== WHATSAPP DEBUG ==========')

    const token = process.env.WHATSAPP_TOKEN
    const phoneID = process.env.WHATSAPP_PHONE_ID

    console.log('Token Exists:', !!token)
    console.log('Phone Number ID:', phoneID)
    console.log('Original Phone:', toPhone)

    if (!token || !phoneID) {
      console.log('⚠️ WhatsApp not configured')
      return {
        success: false,
        message: 'WhatsApp not configured'
      }
    }

    const digits = String(toPhone).replace(/\D/g, '')
    const formatted = digits.startsWith('91')
      ? digits
      : `91${digits}`

    console.log('Formatted Phone:', formatted)

    const payload = {
      messaging_product: 'whatsapp',
      to: formatted,
      type: 'text',
      text: {
        body: message,
      },
    }

    console.log(
      'URL:',
      `https://graph.facebook.com/v23.0/${phoneID}/messages`
    )

    console.log(
      'Payload:',
      JSON.stringify(payload, null, 2)
    )

    const res = await fetch(
      `https://graph.facebook.com/v23.0/${phoneID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    )

    console.log('HTTP Status:', res.status)

    const data = await res.json()

    console.log(
      'Meta Response:',
      JSON.stringify(data, null, 2)
    )

    if (res.ok && data.messages?.length > 0) {
      console.log(`✅ WhatsApp sent to ${formatted}`)
      console.log('Message ID:', data.messages[0].id)

      return {
        success: true,
        data,
      }
    }

    console.error('❌ WhatsApp Failed')
    console.error(
      JSON.stringify(data, null, 2)
    )

    return {
      success: false,
      message:
        data?.error?.message ||
        'Unknown Meta Error',
      data,
    }
  } catch (e) {
    console.error('❌ WhatsApp Exception')
    console.error(e)
    console.error(e.stack)

    return {
      success: false,
      message: e.message,
    }
  }
}
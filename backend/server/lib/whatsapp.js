import { config } from '../config.js'

/**
 * Sends a WhatsApp message via CallMeBot API.
 * Register at https://www.callmebot.com/blog/free-api-whatsapp-messages/
 * Set WHATSAPP_PHONE and WHATSAPP_APIKEY in environment variables.
 */
export async function sendWhatsApp(message) {
  if (!config.whatsappEnabled) return
  try {
    const params = new URLSearchParams({
      phone: config.WHATSAPP_PHONE,
      text: message,
      apikey: config.WHATSAPP_APIKEY,
    })
    const response = await fetch(`https://api.callmebot.com/whatsapp.php?${params.toString()}`)
    if (!response.ok) {
      console.error('WhatsApp notification failed:', response.status, await response.text())
    }
  } catch (error) {
    console.error('WhatsApp notification error:', error.message)
  }
}

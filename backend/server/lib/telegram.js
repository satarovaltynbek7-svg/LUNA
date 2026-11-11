import { config } from '../config.js'

/**
 * Sends a Telegram message via Bot API.
 * Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in environment variables.
 * 
 * To get token: message @BotFather on Telegram → /newbot
 * To get chat_id: message your bot → open https://api.telegram.org/bot<TOKEN>/getUpdates
 */
export async function sendTelegram(message) {
  if (!config.telegramEnabled) return
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    )
    if (!response.ok) {
      console.error('Telegram notification failed:', response.status, await response.text())
    }
  } catch (error) {
    console.error('Telegram notification error:', error.message)
  }
}

import { config } from '../config.js'

/**
 * Sends an email via Brevo (Sendinblue) API.
 * Set BREVO_API_KEY in environment variables.
 */
export async function sendEmail({ to, subject, text, html }) {
  if (!config.brevoEnabled) return
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'LUNA Café', email: 'satarovaltynbek7@gmail.com' },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html,
      }),
    })
    if (!response.ok) {
      console.error('Brevo email failed:', response.status, await response.text())
    }
  } catch (error) {
    console.error('Brevo email error:', error.message)
  }
}

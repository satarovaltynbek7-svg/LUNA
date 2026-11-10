import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../context/ThemeContext.jsx'

export default function BrandedQRCode({ value, size = 220 }) {
  const qrRef = useRef(null)
  const { t } = useTranslation()
  const { theme } = useTheme()
  const night = theme === 'night'
  const background = night ? '#201a15' : '#f7f3ed'
  const foreground = night ? '#d4af37' : '#241a16'

  function downloadCode() {
    const qr = qrRef.current
    if (!qr) throw new Error('QR code canvas is unavailable.')

    const output = document.createElement('canvas')
    output.width = 680
    output.height = 790
    const context = output.getContext('2d')
    if (!context) throw new Error('Unable to create a canvas for the QR code download.')

    context.fillStyle = background
    context.fillRect(0, 0, output.width, output.height)
    context.textAlign = 'center'
    context.fillStyle = foreground
    context.font = '600 23px Arial, sans-serif'
    context.fillText('◔  LUNA CAFÉ', output.width / 2, 67)
    context.fillStyle = night ? '#e8cc78' : '#8c7564'
    context.font = '13px Arial, sans-serif'
    context.fillText(t('qrMenu.scanPrompt'), output.width / 2, 99)
    context.drawImage(qr, 180, 145, 320, 320)
    context.fillStyle = foreground
    context.font = '600 15px Arial, sans-serif'
    context.fillText('LUNA CAFÉ', output.width / 2, 525)
    context.fillStyle = night ? '#e8cc78' : '#8c7564'
    context.font = '12px Arial, sans-serif'
    context.fillText(value, output.width / 2, 552, 610)
    context.fillText(t('qrMenu.brandLine'), output.width / 2, 586)

    const link = document.createElement('a')
    link.download = 'luna-cafe-qr-menu.png'
    link.href = output.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="qr-code-card">
      <div className="qr-code-card__brand"><span aria-hidden="true">◔</span> LUNA <i>CAFÉ</i></div>
      <p>{t('qrMenu.scanPrompt')}</p>
      <QRCodeCanvas
        ref={qrRef}
        value={value}
        size={size}
        level="H"
        includeMargin
        fgColor={foreground}
        bgColor={background}
      />
      <strong>LUNA CAFÉ</strong>
      <small>{t('qrMenu.brandLine')}</small>
      <button className="qr-code-card__download" type="button" onClick={downloadCode}>
        {t('qrMenu.download')}
      </button>
    </div>
  )
}

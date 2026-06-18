"use client"

import { QRCodeSVG } from "qrcode.react"

interface QrCodeProps {
  data: string
  size?: number
  className?: string
}

export function QrCode({ data, size = 200, className }: QrCodeProps) {
  return (
    <div className={className}>
      <QRCodeSVG
        value={data}
        size={size}
        level="M"
        marginSize={2}
        bgColor="#ffffff"
        fgColor="#000000"
        title={`QR Code for ${data}`}
      />
    </div>
  )
}

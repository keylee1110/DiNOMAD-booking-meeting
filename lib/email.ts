import nodemailer from "nodemailer"

export interface BookingEmailPayload {
  customerEmail: string
  customerName: string
  bookingCode: string
  roomName: string
  venueName: string
  venueAddress: string
  bookingDate: string
  startTime: string
  endTime: string
  totalPrice: number
  paymentMethod?: string
}

export function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com"
  const port = Number(process.env.SMTP_PORT) || 465
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "")

  if (!user || !pass) {
    console.warn("SMTP_USER or SMTP_PASS is missing in environment variables.")
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  })
}

export function generateBookingEmailHtml(data: BookingEmailPayload): string {
  const formattedPrice = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(data.totalPrice)

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Xác nhận đặt chỗ - Dinomad</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="padding: 40px 10px;">
          <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
            
            <!-- HEADER -->
            <tr>
              <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; text-align: center;">
                <h1 style="color: #38bdf8; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 1px;">DINOMAD</h1>
                <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 14px;">Xác Nhận Đặt Phòng Thành Công</p>
              </td>
            </tr>

            <!-- CONTENT -->
            <tr>
              <td style="padding: 30px 35px;">
                <p style="font-size: 16px; color: #334155; margin-top: 0;">Xin chào <strong>${data.customerName}</strong>,</p>
                <p style="font-size: 15px; color: #475569; line-height: 1.6;">
                  Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của <strong>Dinomad</strong>! Đơn đặt chỗ của bạn đã được xác nhận thành công. Dưới đây là thông tin chi tiết:
                </p>

                <!-- BOOKING CARD -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 25px 0;">
                  <div style="border-bottom: 2px dashed #cbd5e1; padding-bottom: 12px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase;">MÃ ĐẶT CHỖ</span>
                    <span style="font-size: 18px; color: #0284c7; font-weight: 700; font-family: monospace;">#${data.bookingCode}</span>
                  </div>

                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="6">
                    <tr>
                      <td width="35%" style="font-size: 14px; color: #64748b;">Tên phòng:</td>
                      <td style="font-size: 14px; color: #0f172a; font-weight: 600;">${data.roomName}</td>
                    </tr>
                    <tr>
                      <td style="font-size: 14px; color: #64748b;">Địa điểm:</td>
                      <td style="font-size: 14px; color: #0f172a; font-weight: 600;">${data.venueName}</td>
                    </tr>
                    <tr>
                      <td style="font-size: 14px; color: #64748b;">Địa chỉ:</td>
                      <td style="font-size: 14px; color: #0f172a;">${data.venueAddress}</td>
                    </tr>
                    <tr>
                      <td style="font-size: 14px; color: #64748b;">Ngày sử dụng:</td>
                      <td style="font-size: 14px; color: #0f172a; font-weight: 600;">${data.bookingDate}</td>
                    </tr>
                    <tr>
                      <td style="font-size: 14px; color: #64748b;">Khung giờ:</td>
                      <td style="font-size: 14px; color: #0f172a; font-weight: 600;">${data.startTime} - ${data.endTime}</td>
                    </tr>
                    ${
                      data.paymentMethod
                        ? `
                    <tr>
                      <td style="font-size: 14px; color: #64748b;">Phương thức:</td>
                      <td style="font-size: 14px; color: #0f172a;">${data.paymentMethod}</td>
                    </tr>`
                        : ""
                    }
                    <tr style="border-top: 1px solid #e2e8f0;">
                      <td style="font-size: 15px; color: #0f172a; font-weight: 700; padding-top: 12px;">Tổng thanh toán:</td>
                      <td style="font-size: 18px; color: #16a34a; font-weight: 800; padding-top: 12px;">${formattedPrice}</td>
                    </tr>
                  </table>
                </div>

                <p style="font-size: 14px; color: #64748b; line-height: 1.5;">
                  📍 <strong>Lưu ý:</strong> Vui lòng xuất trình email này hoặc mã đặt chỗ <strong>#${data.bookingCode}</strong> khi đến nhận phòng tại địa điểm.
                </p>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 5px 0;">Dinomad - Đặt không gian làm việc thông minh & tiện lợi</p>
                <p style="margin: 0;">Nếu có thắc mắc, vui lòng liên hệ hotline hoặc bộ phận hỗ trợ khách hàng của Dinomad.</p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `
}

export async function sendBookingConfirmationEmail(data: BookingEmailPayload) {
  const transporter = createTransporter()
  const html = generateBookingEmailHtml(data)

  const mailOptions = {
    from: `"Dinomad Booking" <${process.env.SMTP_USER}>`,
    to: data.customerEmail,
    subject: `[Dinomad] Xác nhận đặt chỗ thành công #${data.bookingCode}`,
    html,
  }

  const info = await transporter.sendMail(mailOptions)
  return info
}

import { NextResponse } from "next/server"
import { sendBookingConfirmationEmail } from "@/lib/email"
import type { BookingEmailPayload } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BookingEmailPayload

    if (!body.customerEmail || !body.bookingCode || !body.roomName) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc (customerEmail, bookingCode, roomName)" },
        { status: 400 }
      )
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json(
        {
          error: "Chưa cấu hình SMTP_USER hoặc SMTP_PASS trong file .env.local!",
          hint: "Vui lòng thêm SMTP_USER (email Gmail) và SMTP_PASS (App Password) vào file .env.local",
        },
        { status: 500 }
      )
    }

    const result = await sendBookingConfirmationEmail(body)

    return NextResponse.json({
      success: true,
      message: `Đã gửi email thành công đến ${body.customerEmail}!`,
      messageId: result.messageId,
    })
  } catch (error: any) {
    console.error("Lỗi khi gửi email:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Không thể gửi email qua SMTP",
      },
      { status: 500 }
    )
  }
}

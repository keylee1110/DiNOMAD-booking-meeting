"use client"

import { useEffect, useState } from "react"
import { CalendarCheck, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react"
import { getAdminBookings } from "@/lib/api/admin"
import type { AdminBooking } from "@/lib/types"

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  confirmed:  { label: "Confirmed",  icon: CheckCircle2, className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" },
  checked_in: { label: "Checked In", icon: CheckCircle2, className: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400" },
  pending:    { label: "Pending",    icon: Clock,        className: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" },
  cancelled:  { label: "Cancelled",  icon: AlertCircle,  className: "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400" },
  completed:  { label: "Completed",  icon: CalendarCheck, className: "text-gray-600 bg-gray-100 dark:bg-gray-500/10 dark:text-gray-400" },
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  useEffect(() => { getAdminBookings().then(setBookings).catch((e) => setError(e.message)).finally(() => setLoading(false)) }, [])
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">All bookings across the platform</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Room / Venue</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Date & Time</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Total</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
              {!loading && error && <tr><td colSpan={6} className="py-12 text-center text-destructive">{error}</td></tr>}
              {!loading && !error && bookings.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No bookings found</td></tr>}
              {bookings.map((booking, i) => {
                const s = statusConfig[booking.status] ?? statusConfig.pending
                return (
                  <tr key={booking.id} className={i < bookings.length - 1 ? "border-b border-border hover:bg-muted/30 transition-colors" : "hover:bg-muted/30 transition-colors"}>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{booking.bookingCode}</td>
                    <td className="px-5 py-3.5 font-medium text-foreground">{booking.customerName}</td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                      <div>{booking.roomName}</div>
                      <div className="text-xs">{booking.venueName}</div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell">
                      <div>{booking.bookingDate}</div>
                      <div className="text-xs">{booking.startTime} – {booking.endTime}</div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground hidden sm:table-cell">
                      {booking.total.toLocaleString("vi-VN")}₫
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${s.className}`}>
                        <s.icon className="w-3 h-3" />
                        {s.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Clock, AlertCircle, CalendarCheck, Loader2 } from "lucide-react"
import { getAdminBookings } from "@/lib/api/admin"
import type { AdminBooking } from "@/lib/types"

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  confirmed: { label: "Confirmed", icon: CheckCircle2, className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" },
  checked_in: { label: "Checked In", icon: CheckCircle2, className: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400" },
  pending: { label: "Pending", icon: Clock, className: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" },
  cancelled: { label: "Cancelled", icon: AlertCircle, className: "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400" },
  completed: { label: "Completed", icon: CalendarCheck, className: "text-gray-600 bg-gray-100 dark:bg-gray-500/10 dark:text-gray-400" },
}

export function RecentBookings() {
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    getAdminBookings()
      .then((all) => setBookings(all.slice(0, 6)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden h-full">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Recent Bookings</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Booking ID</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">User</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Room</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Time</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
            {!loading && error && <tr><td colSpan={5} className="py-10 text-center text-destructive">{error}</td></tr>}
            {!loading && !error && bookings.length === 0 && (
              <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">No bookings yet</td></tr>
            )}
            {bookings.map((booking) => {
              const s = statusConfig[booking.status] ?? statusConfig.pending
              return (
                <tr key={booking.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{booking.bookingCode}</td>
                  <td className="px-5 py-3.5 font-medium text-foreground">{booking.customerName}</td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                    <div className="truncate max-w-[150px]">{booking.roomName}</div>
                    <div className="text-xs truncate max-w-[150px]">{booking.venueName}</div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                    <div>{booking.bookingDate}</div>
                    <div className="text-xs">{booking.startTime} – {booking.endTime}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${s.className}`}>
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
  )
}

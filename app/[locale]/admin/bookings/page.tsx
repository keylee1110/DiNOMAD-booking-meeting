import { CalendarCheck, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react"

const mockBookings = [
  { id: "BK-001", user: "Nguyen Van A", room: "Focus Pod A", venue: "The Coffee Lab", date: "2026-03-22", time: "09:00 – 11:00", total: 160000, status: "confirmed" },
  { id: "BK-002", user: "Tran Thi B", room: "Collab Room B", venue: "The Coffee Lab", date: "2026-03-22", time: "10:00 – 12:00", total: 300000, status: "checked_in" },
  { id: "BK-003", user: "Le Minh C", room: "Sunshine Meeting Room", venue: "Nomad Hub D10", date: "2026-03-22", time: "13:00 – 15:00", total: 240000, status: "pending" },
  { id: "BK-004", user: "Pham Thi D", room: "Executive Board Room", venue: "Workspace Saigon", date: "2026-03-22", time: "14:00 – 16:00", total: 500000, status: "confirmed" },
  { id: "BK-005", user: "Hoang Van E", room: "Rooftop Pod", venue: "BookCafe Central", date: "2026-03-21", time: "16:00 – 17:00", total: 100000, status: "cancelled" },
  { id: "BK-006", user: "Dao Thi F", room: "Library Room", venue: "BookCafe Central", date: "2026-03-21", time: "08:00 – 10:00", total: 400000, status: "completed" },
  { id: "BK-007", user: "Bui Van G", room: "Private Study Booth", venue: "Nomad Hub D10", date: "2026-03-20", time: "15:00 – 17:00", total: 120000, status: "completed" },
]

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  confirmed:  { label: "Confirmed",  icon: CheckCircle2, className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" },
  checked_in: { label: "Checked In", icon: CheckCircle2, className: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400" },
  pending:    { label: "Pending",    icon: Clock,        className: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" },
  cancelled:  { label: "Cancelled",  icon: AlertCircle,  className: "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400" },
  completed:  { label: "Completed",  icon: CalendarCheck, className: "text-gray-600 bg-gray-100 dark:bg-gray-500/10 dark:text-gray-400" },
}

export default function AdminBookingsPage() {
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
              {mockBookings.map((booking, i) => {
                const s = statusConfig[booking.status]
                return (
                  <tr key={booking.id} className={i < mockBookings.length - 1 ? "border-b border-border hover:bg-muted/30 transition-colors" : "hover:bg-muted/30 transition-colors"}>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{booking.id}</td>
                    <td className="px-5 py-3.5 font-medium text-foreground">{booking.user}</td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                      <div>{booking.room}</div>
                      <div className="text-xs">{booking.venue}</div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell">
                      <div>{booking.date}</div>
                      <div className="text-xs">{booking.time}</div>
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

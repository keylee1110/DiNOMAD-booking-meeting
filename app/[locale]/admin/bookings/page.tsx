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
  confirmed:  { label: "Confirmed",  icon: CheckCircle2, className: "text-emerald-700 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 border border-black/5" },
  checked_in: { label: "Checked In", icon: CheckCircle2, className: "text-blue-700 bg-blue-100 dark:bg-blue-500/20 dark:text-blue-400 border border-black/5" },
  pending:    { label: "Pending",    icon: Clock,        className: "text-amber-700 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400 border border-black/5" },
  cancelled:  { label: "Cancelled",  icon: AlertCircle,  className: "text-red-700 bg-red-100 dark:bg-red-500/20 dark:text-red-400 border border-black/5" },
  completed:  { label: "Completed",  icon: CalendarCheck, className: "text-gray-700 bg-gray-200 dark:bg-gray-500/20 dark:text-gray-400 border border-black/5" },
}

export default function AdminBookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">All bookings across the platform</p>
      </div>

      <div className="bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/40 dark:border-white/10 bg-muted/20">
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">ID</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Room / Venue</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Date & Time</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Total</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40 dark:divide-white/10">
              {mockBookings.map((booking, i) => {
                const s = statusConfig[booking.status]
                return (
                  <tr key={booking.id} className="hover:bg-white/40 dark:hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground font-medium group-hover:text-primary transition-colors">{booking.id}</td>
                    <td className="px-6 py-4 font-semibold text-foreground">{booking.user}</td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="font-medium text-foreground">{booking.room}</div>
                      <div className="text-xs font-medium text-muted-foreground mt-0.5">{booking.venue}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground hidden lg:table-cell">
                      <div className="font-medium text-foreground">{booking.date}</div>
                      <div className="text-xs font-medium text-muted-foreground mt-0.5">{booking.time}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground hidden sm:table-cell tracking-tight">
                      {booking.total.toLocaleString("vi-VN")}₫
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm ${s.className}`}>
                        <s.icon className="w-3.5 h-3.5" />
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

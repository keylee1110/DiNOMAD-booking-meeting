import { CheckCircle2, Clock, AlertCircle } from "lucide-react"

const recentBookings = [
  { id: "BK-001", user: "Nguyen Van A", room: "Focus Pod A", venue: "The Coffee Lab", time: "09:00 – 11:00", status: "confirmed" },
  { id: "BK-002", user: "Tran Thi B", room: "Collab Room B", venue: "The Coffee Lab", time: "10:00 – 12:00", status: "checked_in" },
  { id: "BK-003", user: "Le Minh C", room: "Sunshine Meeting Room", venue: "Nomad Hub D10", time: "13:00 – 15:00", status: "pending" },
  { id: "BK-004", user: "Pham Thi D", room: "Executive Board Room", venue: "Workspace Saigon", time: "14:00 – 16:00", status: "confirmed" },
  { id: "BK-005", user: "Hoang Van E", room: "Rooftop Pod", venue: "BookCafe Central", time: "16:00 – 17:00", status: "cancelled" },
]

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  confirmed: { label: "Confirmed", icon: CheckCircle2, className: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" },
  checked_in: { label: "Checked In", icon: CheckCircle2, className: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400" },
  pending: { label: "Pending", icon: Clock, className: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400" },
  cancelled: { label: "Cancelled", icon: AlertCircle, className: "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400" },
}

export function RecentBookings() {
  return (
    <div className="bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl overflow-hidden h-full shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="px-6 py-5 border-b border-white/40 dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-muted/10">
        <h2 className="font-bold text-foreground text-lg tracking-tight">Recent Bookings</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/40 dark:border-white/10 bg-muted/20">
              <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Booking ID</th>
              <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">User</th>
              <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Room</th>
              <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Time</th>
              <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/40 dark:divide-white/10">
            {recentBookings.map((booking) => {
              const s = statusConfig[booking.status]
              return (
                <tr key={booking.id} className="hover:bg-white/40 dark:hover:bg-muted/20 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground font-medium group-hover:text-primary transition-colors">{booking.id}</td>
                  <td className="px-6 py-4 font-semibold text-foreground">{booking.user}</td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="font-medium text-foreground truncate max-w-[150px]">{booking.room}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[150px] mt-0.5">{booking.venue}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-muted-foreground hidden lg:table-cell whitespace-nowrap">{booking.time}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md whitespace-nowrap shadow-sm border border-black/5 ${s.className}`}>
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
  )
}

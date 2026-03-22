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
            {recentBookings.map((booking) => {
              const s = statusConfig[booking.status]
              return (
                <tr key={booking.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{booking.id}</td>
                  <td className="px-5 py-3.5 font-medium text-foreground">{booking.user}</td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                    <div className="truncate max-w-[150px]">{booking.room}</div>
                    <div className="text-xs truncate max-w-[150px]">{booking.venue}</div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell whitespace-nowrap">{booking.time}</td>
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

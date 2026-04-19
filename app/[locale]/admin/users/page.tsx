import { Users, CheckCircle2, Clock, Search } from "lucide-react"

const mockUsers = [
  { id: "U-001", name: "Nguyen Van A", email: "van.a@email.com", phone: "0901234567", bookings: 12, joined: "2025-11-10", status: "active" },
  { id: "U-002", name: "Tran Thi B", email: "thi.b@email.com", phone: "0912345678", bookings: 8, joined: "2025-12-05", status: "active" },
  { id: "U-003", name: "Le Minh C", email: "minh.c@email.com", phone: "0923456789", bookings: 3, joined: "2026-01-20", status: "active" },
  { id: "U-004", name: "Pham Thi D", email: "thi.d@email.com", phone: "0934567890", bookings: 22, joined: "2025-09-15", status: "active" },
  { id: "U-005", name: "Hoang Van E", email: "van.e@email.com", phone: "0945678901", bookings: 1, joined: "2026-03-01", status: "inactive" },
]

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{mockUsers.length} registered users</p>
        </div>
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400 border border-black/5 rounded-lg px-4 py-2.5 shadow-sm">
          <Users className="w-4 h-4" />
          <span>{mockUsers.filter(u => u.status === "active").length} active</span>
        </div>
      </div>

      <div className="bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-5 shadow-sm">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-white/50 dark:bg-muted/30 border border-white/60 dark:border-border/50 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-foreground placeholder:text-muted-foreground transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/40 dark:border-white/10 bg-muted/20">
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Phone</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Joined</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Bookings</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40 dark:divide-white/10">
              {mockUsers.map((user, i) => (
                <tr key={user.id} className="hover:bg-white/40 dark:hover:bg-muted/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-sm">
                        <span className="text-primary font-bold text-sm tracking-tight">{user.name[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{user.name}</div>
                        <div className="text-xs font-medium text-muted-foreground truncate mt-0.5">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-muted-foreground hidden md:table-cell">{user.phone}</td>
                  <td className="px-6 py-4 font-medium text-muted-foreground hidden lg:table-cell">{user.joined}</td>
                  <td className="px-6 py-4 font-semibold text-foreground hidden sm:table-cell">{user.bookings}</td>
                  <td className="px-6 py-4">
                    {user.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm border border-black/5 text-emerald-700 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                       <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm border border-black/5 text-gray-700 bg-gray-200 dark:bg-gray-500/20 dark:text-gray-400">
                        <Clock className="w-3.5 h-3.5" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

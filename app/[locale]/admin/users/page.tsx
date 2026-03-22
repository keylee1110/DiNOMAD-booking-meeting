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
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-card border border-border rounded-md px-4 py-2">
          <Users className="w-4 h-4" />
          <span>{mockUsers.filter(u => u.status === "active").length} active</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted border border-border rounded-md outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Phone</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Joined</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Bookings</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.map((user, i) => (
                <tr key={user.id} className={i < mockUsers.length - 1 ? "border-b border-border hover:bg-muted/30 transition-colors" : "hover:bg-muted/30 transition-colors"}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-xs">{user.name[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">{user.phone}</td>
                  <td className="px-5 py-4 text-muted-foreground hidden lg:table-cell">{user.joined}</td>
                  <td className="px-5 py-4 font-medium text-foreground hidden sm:table-cell">{user.bookings}</td>
                  <td className="px-5 py-4">
                    {user.status === "active" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-gray-600 bg-gray-100 dark:bg-gray-500/10 dark:text-gray-400">
                        <Clock className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <button className="text-xs font-medium text-primary hover:underline">View</button>
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

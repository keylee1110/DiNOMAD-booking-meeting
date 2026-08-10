"use client"

import { useEffect, useMemo, useState } from "react"
import { Users, CheckCircle2, Clock, Search, Loader2 } from "lucide-react"
import { getAdminUsers } from "@/lib/api/admin"
import type { AdminUser } from "@/lib/types"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")

  useEffect(() => {
    getAdminUsers()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        (u.fullName ?? "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? "").includes(q),
    )
  }, [users, query])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{users.length} registered users</p>
        </div>
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-card border border-border rounded-md px-4 py-2">
          <Users className="w-4 h-4" />
          <span>{users.filter((u) => u.status === "active").length} active</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name, email or phone..."
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
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Role</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Joined</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Bookings</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={6} className="py-12 text-center text-destructive">{error}</td></tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No users found</td></tr>
              )}
              {filtered.map((user, i) => {
                const displayName = user.fullName || user.email
                return (
                  <tr key={user.id} className={i < filtered.length - 1 ? "border-b border-border hover:bg-muted/30 transition-colors" : "hover:bg-muted/30 transition-colors"}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-primary font-bold text-xs">{displayName[0]?.toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground">{displayName}</div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">{user.phone || "—"}</td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground hidden lg:table-cell">{user.createdAt?.slice(0, 10)}</td>
                    <td className="px-5 py-4 font-medium text-foreground hidden sm:table-cell">{user.bookingsCount}</td>
                    <td className="px-5 py-4">
                      {user.status === "active" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-gray-600 bg-gray-100 dark:bg-gray-500/10 dark:text-gray-400">
                          <Clock className="w-3 h-3" /> {user.status === "blocked" ? "Blocked" : "Inactive"}
                        </span>
                      )}
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

"use client"

import { useEffect, useState } from "react"
import { DoorOpen, CalendarCheck, Users, TrendingUp, LucideIcon } from "lucide-react"
import { getAdminBookings, getAdminRooms, getAdminUsers } from "@/lib/api/admin"

interface StatItem {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  color: string
  bg: string
}

function todayVietnam(): string {
  const now = new Date()
  const vn = new Date(now.getTime() + (now.getTimezoneOffset() + 7 * 60) * 60_000)
  return `${vn.getFullYear()}-${String(vn.getMonth() + 1).padStart(2, "0")}-${String(vn.getDate()).padStart(2, "0")}`
}

export function StatsGrid() {
  const [stats, setStats] = useState<StatItem[] | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([getAdminRooms(), getAdminBookings(), getAdminUsers()])
      .then(([rooms, bookings, users]) => {
        const today = todayVietnam()
        const active = bookings.filter((b) => b.status !== "cancelled")
        const bookingsToday = active.filter((b) => b.bookingDate === today).length
        const revenue = active.reduce((sum, b) => sum + b.total, 0)
        const revenueLabel =
          revenue >= 1_000_000
            ? `₫${(revenue / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
            : `₫${revenue.toLocaleString("vi-VN")}`

        setStats([
          {
            label: "Total Rooms",
            value: String(rooms.length),
            hint: `${rooms.filter((r) => r.status === "published").length} published`,
            icon: DoorOpen,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "Bookings Today",
            value: String(bookingsToday),
            hint: `${active.length} total bookings`,
            icon: CalendarCheck,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Registered Users",
            value: users.length.toLocaleString("vi-VN"),
            hint: `${users.filter((u) => u.status === "active").length} active`,
            icon: Users,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
          {
            label: "Total Revenue",
            value: revenueLabel,
            hint: "excl. cancelled bookings",
            icon: TrendingUp,
            color: "text-primary",
            bg: "bg-primary/10",
          },
        ])
      })
      .catch((e) => setError(e.message))
  }, [])

  if (error) {
    return (
      <div className="bg-card border border-border rounded-lg p-5 text-sm text-destructive">
        Failed to load stats: {error}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {(stats ?? Array.from({ length: 4 }, () => null)).map((stat, i) =>
        stat ? (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-lg p-5 flex items-start gap-4 hover:shadow-sm transition-shadow"
          >
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.hint}</p>
            </div>
          </div>
        ) : (
          <div key={i} className="bg-card border border-border rounded-lg p-5 h-[102px] animate-pulse" />
        ),
      )}
    </div>
  )
}

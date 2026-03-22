import { DoorOpen, CalendarCheck, Users, TrendingUp, LucideIcon } from "lucide-react"

interface StatItem {
  label: string
  value: string
  change: string
  icon: LucideIcon
  color: string
  bg: string
}

const stats: StatItem[] = [
  {
    label: "Total Rooms",
    value: "10",
    change: "+2 this month",
    icon: DoorOpen,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    label: "Bookings Today",
    value: "24",
    change: "+8 from yesterday",
    icon: CalendarCheck,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    label: "Active Users",
    value: "1,284",
    change: "+134 this week",
    icon: Users,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    label: "Total Revenue",
    value: "₫14.2M",
    change: "+18% vs. last month",
    icon: TrendingUp,
    color: "text-primary",
    bg: "bg-primary/10",
  },
]

export function StatsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat) => (
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
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">{stat.change}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

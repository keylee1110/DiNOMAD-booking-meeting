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
          className="bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 flex items-start gap-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-0.5 group"
        >
          <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</p>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">{stat.label}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-semibold bg-emerald-50 dark:bg-emerald-500/10 inline-block px-2 py-0.5 rounded-md">{stat.change}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

"use client"

import { useState, useMemo, useEffect } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { TrendingUp, AlertCircle, Check, QrCode, Search, Activity, ArrowRight, ArrowUpRight, BarChart3, Clock, ArrowDownRight, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PartnerDashboard() {
  const { t, locale } = useTranslation()
  const [showAlert, setShowAlert] = useState(true)

  // Load local bookings to simulate real-time full-stack sync
  const [localBookings, setLocalBookings] = useState<any[]>([])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved: any[] = JSON.parse(localStorage.getItem("dinomad_bookings") || "[]")
      const timer = setTimeout(() => {
        setLocalBookings(saved)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [])

  // Dynamically compute Today's Earnings
  const todayEarningsValue = useMemo(() => {
    const sum = localBookings.reduce((acc, b) => acc + (b.paidAmount || 0), 0)
    const base = 2400000 // 2.4M base
    const total = base + sum
    if (total >= 1000000) {
      return `${(total / 1000000).toFixed(2)}M ₫`
    }
    return `${total.toLocaleString()} ₫`
  }, [localBookings])

  // Dynamically compute Upcoming Bookings Count
  const upcomingTodayCount = useMemo(() => {
    const activeCount = localBookings.filter(b => b.status === "confirmed" || b.status === "pending").length
    return 8 + activeCount
  }, [localBookings])

  const metrics = useMemo(() => [
    { label: "Today's Earnings", value: todayEarningsValue, trend: "+12%", status: "up" },
    { label: "Week to Date", value: "15.8M ₫", trend: "+5%", status: "up" },
    { label: "Active Walk-ins", value: "3", trend: "0%", status: "neutral" },
    { label: "Upcoming (Today)", value: upcomingTodayCount.toString(), trend: "-2%", status: "down" },
  ], [todayEarningsValue, upcomingTodayCount])

  const activityFeed = useMemo(() => {
    const baseFeed = [
      { id: 1, type: "check-in", text: "Customer checked into Solo Nook A", time: "10 mins ago" },
      { id: 2, type: "booking", text: "Booking BK016 confirmed for Team Hub B", time: "25 mins ago" },
      { id: 3, type: "check-out", text: "Customer checked out of Team Hub A", time: "1 hr ago" },
      { id: 4, type: "system", text: "Inventory globally synced", time: "2 hrs ago" },
    ]

    const localFeedItems = localBookings.map((b) => {
      const isCheckin = b.status === "checked_in"
      return {
        id: `local-${b.id}`,
        type: isCheckin ? "check-in" : "booking",
        text: isCheckin 
          ? `Customer checked into ${b.roomName}` 
          : `Booking ${b.id} confirmed for ${b.roomName} (${b.paymentStatus === 'deposited' ? 'Deposited' : 'Paid'})`,
        time: "Just now",
      }
    })

    return [...localFeedItems, ...baseFeed]
  }, [localBookings])

  const actionItems = [
    { id: "A1", title: "Pending Approval", desc: "Booking BK014 requires manual confirmation.", urgency: "high", action: "Review" },
    { id: "A2", title: "Room Turnover", desc: "Solo Nook C needs to be marked properly cleaned.", urgency: "medium", action: "Mark Clean" },
  ]

  return (
    <div className="flex flex-col gap-8 md:gap-12 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
      {/* Header section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="border-l-2 border-primary/40 pl-4 text-sm md:text-base text-muted-foreground max-w-xl">
          Overview of today's operational metrics, revenue flow, and urgent tasks.
        </p>
      </div>

      {/* Zalo-style Instant Alert Mock */}
      {showAlert && (
        <div className="flex items-start gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-4 md:p-5 relative animate-in slide-in-from-top-4 fade-in duration-300 shadow-[0_4px_12px_rgba(59,130,246,0.04)]">
          <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-blue-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-800 tracking-tight text-sm md:text-base">New Instant Booking!</h3>
            <p className="text-xs md:text-sm text-blue-700/90 mt-1">Booking <strong className="font-semibold text-blue-900">BK015</strong> (Team Hub B) confirmed for 18:00.</p>
          </div>
          <button 
            onClick={() => setShowAlert(false)} 
            className="text-blue-500 hover:bg-blue-100/80 p-1.5 rounded-lg transition-colors"
          >
             <Check className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Metrics Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-4">
        {metrics.map((m, i) => (
          <div 
            key={i} 
            className="flex flex-col rounded-2xl border border-border/50 bg-card p-5 md:p-6 shadow-[0_4px_20px_-4px_rgba(41,35,30,0.04)] hover:-translate-y-0.5 transition-all duration-300"
          >
             <span className="text-xs font-semibold text-muted-foreground tracking-tight mb-2.5">{m.label}</span>
             <span className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{m.value}</span>
             <div className={`flex items-center gap-1.5 mt-4 text-[10px] md:text-xs font-semibold self-start px-2.5 py-1 rounded-full border ${
               m.status === 'up' ? 'text-green-700 bg-green-500/10 border-green-500/20' : 
               m.status === 'down' ? 'text-red-700 bg-red-500/10 border-red-500/20' : 
               'text-muted-foreground bg-muted border-border/40'
             }`}>
               {m.status === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : m.status === 'down' ? <ArrowDownRight className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5 opacity-50" />}
               {m.trend}
             </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        
        {/* Main Content Column (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
           
           {/* Urgent Action Feed */}
           <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col gap-6">
              <h2 className="text-lg md:text-xl font-semibold tracking-tight flex items-center gap-3 border-b border-border/50 pb-4 text-foreground">
                <Zap className="h-5 w-5 text-orange-500 fill-orange-500" /> Requires Action
              </h2>
              <div className="flex flex-col gap-4">
                 {actionItems.map(action => (
                   <div 
                     key={action.id} 
                     className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-5 rounded-xl border transition-all duration-200 ${
                       action.urgency === 'high' 
                         ? 'border-red-100 bg-red-50/50 hover:bg-red-50' 
                         : 'border-border/60 bg-background/50 hover:bg-muted/30'
                     }`}
                   >
                     <div className="flex flex-col gap-1.5">
                       <span className="font-semibold text-sm md:text-base flex items-center gap-2 text-foreground">
                         {action.urgency === 'high' && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>}
                         {action.title}
                       </span>
                       <span className="text-xs text-muted-foreground font-medium">{action.desc}</span>
                     </div>
                     <Button 
                       size="sm" 
                       variant={action.urgency === 'high' ? 'destructive' : 'default'} 
                       className="rounded-xl px-5 font-semibold text-xs shadow-sm w-full sm:w-auto"
                     >
                       {action.action}
                     </Button>
                   </div>
                 ))}
              </div>
           </div>

           {/* Revenue Snapshot Mock Chart */}
           <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <h2 className="text-lg md:text-xl font-semibold tracking-tight flex items-center gap-3 text-foreground">
                  <BarChart3 className="h-5 w-5 text-primary" /> Last 7 Days Revenue
                </h2>
                <span className="text-sm md:text-base font-semibold text-primary bg-primary/10 px-3.5 py-1 rounded-full border border-primary/25">15.8M ₫</span>
              </div>
              
              {/* CSS modern bar chart */}
              <div className="flex items-end justify-between gap-2 h-48 mt-8 px-2 md:px-6">
                 {[40, 60, 30, 80, 50, 90, 75].map((height, i) => (
                   <div key={i} className="w-full flex justify-end flex-col items-center gap-2 group h-full relative">
                      <div className="text-[10px] md:text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity text-primary bg-background border border-primary/30 shadow-md rounded-md px-2 py-0.5 -translate-y-2.5 absolute z-10">{height * 10}k</div>
                      <div 
                        className={`w-full max-w-[32px] md:max-w-[40px] rounded-t-lg transition-all duration-300 ease-out group-hover:-translate-y-0.5 ${
                          i === 6 
                            ? 'bg-primary' 
                            : 'bg-primary/15 hover:bg-primary/25'
                        }`}
                        style={{ height: `${height}%` }}
                      ></div>
                      <div className="text-xs font-medium text-muted-foreground mt-1">
                        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}
                      </div>
                   </div>
                 ))}
              </div>
           </div>

        </div>

        {/* Sidebar Column (1/3 width) */}
        <div className="flex flex-col gap-8">
          
          {/* Quick Scanner */}
          <div className="rounded-2xl border border-transparent bg-primary text-primary-foreground p-6 md:p-8 shadow-[0_8px_30px_rgba(100,181,246,0.15)] relative overflow-hidden group">
             <div className="absolute -right-10 -top-10 h-32 w-32 bg-foreground/10 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out z-0"></div>
             
             <h2 className="text-lg md:text-xl font-semibold mb-2.5 flex items-center gap-2 relative z-10 text-primary-foreground">
               <QrCode className="h-6 w-6 md:h-7 md:w-7 text-primary-foreground" /> Quick Scan
             </h2>
             <p className="text-sm mb-6 text-primary-foreground/90 font-medium relative z-10 leading-relaxed">Process walk-ins or verify bookings instantly.</p>
             
             <Link href={`/${locale}/partner/scanner`} className="relative z-10 w-full block">
               <Button className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/95 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm">
                 <Search className="h-4 w-4" /> Open Camera
               </Button>
             </Link>
          </div>

          {/* Activity Logs */}
          <div className="flex flex-col rounded-2xl border border-border/50 bg-card shadow-[0_4px_20px_-4px_rgba(41,35,30,0.04)] overflow-hidden">
             <div className="flex items-center justify-between border-b border-border/40 p-4 bg-muted/10">
               <h2 className="text-sm md:text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
                 <Activity className="h-4 w-4 md:h-5 md:w-5 text-primary" /> Live Feed
               </h2>
               <span className="text-[10px] font-semibold text-muted-foreground bg-background border border-border/60 rounded-full px-2.5 py-0.5">Auto-sync</span>
             </div>
             
             <div className="flex flex-col">
                {activityFeed.map((item, i) => (
                  <div 
                    key={item.id} 
                    className={`flex gap-3 p-4 border-b border-border/30 transition-colors ${
                      i === 0 
                        ? 'bg-primary/5 hover:bg-primary/10' 
                        : 'bg-card hover:bg-muted/30'
                    } ${i === activityFeed.length - 1 ? 'border-b-0' : ''}`}
                  >
                     <div className="pt-0.5 shrink-0">
                       {item.type === 'check-in' && <ArrowRight className="h-4 w-4 text-[#84cc16]" />}
                       {item.type === 'booking' && <AlertCircle className="h-4 w-4 text-blue-500 fill-blue-500 text-white" />}
                       {item.type === 'check-out' && <Check className="h-4 w-4 text-muted-foreground font-semibold" />}
                       {item.type === 'system' && <Clock className="h-4 w-4 text-muted-foreground" />}
                     </div>
                     <div className="flex flex-col gap-1">
                       <span className={`text-xs font-semibold leading-tight ${i === 0 ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>{item.text}</span>
                       <span className="text-[10px] text-muted-foreground font-semibold">{item.time}</span>
                     </div>
                  </div>
                ))}
             </div>
             <button className="text-xs font-semibold text-foreground bg-muted/20 hover:bg-muted/40 border-t border-border/40 transition-colors text-center py-3.5">
               View Full Logs →
             </button>
          </div>
        </div>

      </div>
    </div>
  )
}

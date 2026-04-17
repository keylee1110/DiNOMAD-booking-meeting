"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { TrendingUp, AlertCircle, Check, QrCode, Search, Activity, ArrowRight, ArrowUpRight, BarChart3, Clock, ArrowDownRight, Zap } from "lucide-react"
import Link from "next/link"

export default function PartnerDashboard() {
  const { t, locale } = useTranslation()
  const [showAlert, setShowAlert] = useState(true)

  // Mock data
  const metrics = [
    { label: "Today's Earnings", value: "2.4M ₫", trend: "+12%", status: "up" },
    { label: "Week to Date", value: "15.8M ₫", trend: "+5%", status: "up" },
    { label: "Active Walk-ins", value: "3", trend: "0%", status: "neutral" },
    { label: "Upcoming (Today)", value: "8", trend: "-2%", status: "down" },
  ]

  const activityFeed = [
    { id: 1, type: "check-in", text: "Customer checked into Solo Nook A", time: "10 mins ago" },
    { id: 2, type: "booking", text: "Booking BK016 confirmed for Team Hub B", time: "25 mins ago" },
    { id: 3, type: "check-out", text: "Customer checked out of Team Hub A", time: "1 hr ago" },
    { id: 4, type: "system", text: "Inventory globally synced", time: "2 hrs ago" },
  ]

  const actionItems = [
    { id: "A1", title: "Pending Approval", desc: "Booking BK014 requires manual confirmation.", urgency: "high", action: "Review" },
    { id: "A2", title: "Room Turnover", desc: "Solo Nook C needs to be marked properly cleaned.", urgency: "medium", action: "Mark Clean" },
  ]

  return (
    <div className="flex flex-col gap-10 md:gap-14 animate-in fade-in duration-500 max-w-7xl mx-auto w-full">
      {/* Header section */}
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Partner Dashboard</h1>
        <p className="text-base font-medium text-muted-foreground w-full max-w-xl">
          Overview of today's operational metrics, revenue flow, and urgent tasks.
        </p>
      </div>

      {/* Zalo-style Instant Alert Mock */}
      {showAlert && (
        <div className="flex items-start gap-4 bg-blue-50/80 dark:bg-blue-900/10 backdrop-blur-md p-4 md:p-5 border border-blue-200 dark:border-blue-800 rounded-2xl relative shadow-sm animate-in fade-in zoom-in-95 duration-500">
          <AlertCircle className="h-6 w-6 text-blue-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-blue-800 dark:text-blue-400">New Instant Booking!</h3>
            <p className="text-sm font-medium mt-1 text-blue-900/80 dark:text-blue-300">Booking <strong className="font-bold text-blue-900 dark:text-blue-200">BK015</strong> (Team Hub B) confirmed for 18:00.</p>
          </div>
          <button onClick={() => setShowAlert(false)} className="text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 p-1.5 rounded-lg transition-colors">
             <Check className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Top Metrics Grid */}
      <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <div key={i} className="flex flex-col bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 transition-transform group">
             <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{m.label}</span>
             <span className="text-3xl font-bold text-foreground tracking-tight">{m.value}</span>
             <div className={`flex items-center gap-1.5 mt-4 text-xs font-bold self-start px-2 py-0.5 rounded-md ${
               m.status === 'up' ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/20' : 
               m.status === 'down' ? 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-500/20' : 
               'text-muted-foreground bg-muted border border-transparent'
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
           <div className="bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400 fill-current" />
                </div>
                Requires Action
              </h2>
              <div className="flex flex-col gap-4">
                 {actionItems.map(action => (
                   <div key={action.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-5 rounded-xl border transition-colors ${action.urgency === 'high' ? 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-900/10 hover:border-red-300' : 'border-white/60 dark:border-white/10 bg-white/40 dark:bg-muted/20 hover:border-border'}`}>
                     <div className="flex flex-col gap-1.5">
                       <span className="font-semibold text-base text-foreground flex items-center gap-2">
                         {action.urgency === 'high' && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>}
                         {action.title}
                       </span>
                       <span className="text-sm font-medium text-muted-foreground">{action.desc}</span>
                     </div>
                     <button className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm w-full sm:w-auto hover:-translate-y-0.5 ${action.urgency === 'high' ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-4 focus:ring-red-500/20' : 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-4 focus:ring-primary/20'}`}>
                       {action.action}
                     </button>
                   </div>
                 ))}
              </div>
           </div>

           {/* Revenue Snapshot Mock Chart */}
           <div className="bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex items-center justify-between border-b border-white/40 dark:border-white/10 pb-6 mb-6">
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  Last 7 Days
                </h2>
                <span className="text-xl font-bold text-primary tracking-tight">15.8M ₫</span>
              </div>
              
              <div className="flex items-end justify-between gap-3 h-48 mt-8 px-2 md:px-6">
                 {[40, 60, 30, 80, 50, 90, 75].map((height, i) => (
                   <div key={i} className="w-full flex justify-end flex-col items-center gap-3 group h-full">
                      <div className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity text-primary bg-white/90 dark:bg-card/90 shadow-sm rounded-md px-2 py-1 -translate-y-2 absolute z-10">{height * 10}k</div>
                      <div 
                        className={`w-full max-w-[40px] md:max-w-[48px] rounded-t-xl transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-md ${i === 6 ? 'bg-primary' : 'bg-primary/20 group-hover:bg-primary/40'}`}
                        style={{ height: `${height}%` }}
                      ></div>
                      <div className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase">
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
          <div className="bg-primary text-primary-foreground p-6 md:p-8 rounded-2xl shadow-xl shadow-primary/20 relative overflow-hidden group">
             <div className="absolute -right-10 -top-10 h-40 w-40 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out z-0"></div>
             
             <div className="relative z-10">
               <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-5 border border-white/20">
                 <QrCode className="h-6 w-6 text-white" />
               </div>
               <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2 text-white">
                 Quick Scan
               </h2>
               <p className="text-sm mb-6 font-medium text-white/80 leading-relaxed">Process walk-ins or verify bookings instantly.</p>
               
               <Link href={`/${locale}/partner/scanner`}>
                 <button className="w-full bg-white text-primary rounded-xl py-3 text-sm font-bold hover:bg-white/90 transition-all flex justify-center items-center gap-2 shadow-sm hover:-translate-y-0.5">
                   <Search className="h-4 w-4" /> Open Camera
                 </button>
               </Link>
             </div>
          </div>

          {/* Activity Logs */}
          <div className="flex flex-col bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
             <div className="flex items-center justify-between border-b border-white/40 dark:border-white/10 p-5 bg-white/40 dark:bg-muted/10">
               <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
                 <Activity className="h-4 w-4 text-primary" /> Live Feed
               </h2>
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-white/50 dark:bg-muted/30 px-2 py-1 rounded-md shadow-sm">Auto-sync</span>
             </div>
             
             <div className="flex flex-col">
               {activityFeed.map((item, i) => (
                 <div key={item.id} className={`flex gap-3 px-5 py-4 border-b border-white/40 dark:border-white/10 transition-colors ${i === 0 ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-white/40 dark:hover:bg-muted/20'} ${i === activityFeed.length - 1 ? 'border-b-0' : ''}`}>
                    <div className="pt-0.5 shrink-0">
                      {item.type === 'check-in' && <ArrowRight className="h-4 w-4 text-emerald-500" />}
                      {item.type === 'booking' && <AlertCircle className="h-4 w-4 text-blue-500 fill-blue-100" />}
                      {item.type === 'check-out' && <Check className="h-4 w-4 text-muted-foreground" />}
                      {item.type === 'system' && <Clock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`text-sm font-semibold leading-tight ${i === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{item.text}</span>
                      <span className="text-xs text-muted-foreground font-medium">{item.time}</span>
                    </div>
                 </div>
               ))}
             </div>
             <button className="text-xs font-bold text-primary hover:bg-white/50 dark:hover:bg-muted/30 border-t border-white/40 dark:border-white/10 transition-all text-center py-4">View Full Logs →</button>
          </div>
        </div>

      </div>
    </div>
  )
}

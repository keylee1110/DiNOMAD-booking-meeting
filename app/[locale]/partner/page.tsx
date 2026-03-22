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
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl md:text-[3.5rem] font-black uppercase tracking-tighter leading-[0.85]">Dashboard</h1>
        <p className="border-l-4 border-primary pl-4 text-base md:text-lg font-medium text-muted-foreground max-w-xl">
          Overview of today's operational metrics, revenue flow, and urgent tasks.
        </p>
      </div>

      {/* Zalo-style Instant Alert Mock */}
      {showAlert && (
        <div className="flex items-start gap-4 border-l-[6px] border-l-blue-500 bg-blue-50 p-4 md:p-5 border-y-2 border-r-2 border-border relative animate-in slide-in-from-top-4 fade-in duration-300 shadow-[4px_4px_0px_0px_#3b82f6]">
          <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-blue-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-black uppercase tracking-wider text-blue-700 md:text-lg">New Instant Booking!</h3>
            <p className="text-sm md:text-base font-medium mt-1 text-blue-900">Booking <strong className="font-black">BK015</strong> (Team Hub B) confirmed for 18:00.</p>
          </div>
          <button onClick={() => setShowAlert(false)} className="bg-blue-500 text-white p-1 hover:bg-blue-700 transition-colors border-2 border-transparent">
             <Check className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Top Metrics Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-4">
        {metrics.map((m, i) => (
          <div key={i} className="flex flex-col border-2 border-foreground bg-card p-5 md:p-6 shadow-[5px_5px_0px_0px_var(--color-primary)] transition-transform hover:-translate-y-1">
             <span className="text-[10px] md:text-[11px] font-black uppercase text-muted-foreground tracking-widest mb-3">{m.label}</span>
             <span className="text-2xl md:text-4xl font-black uppercase tracking-tighter">{m.value}</span>
             <div className={`flex items-center gap-1.5 mt-4 text-[10px] md:text-xs font-black self-start px-2 py-1 border-2 uppercase tracking-wider ${
               m.status === 'up' ? 'text-green-700 bg-[#C1FF72]/20 border-[#C1FF72]' : 
               m.status === 'down' ? 'text-red-700 bg-red-100 border-red-300' : 
               'text-muted-foreground bg-muted border-border'
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
           <div className="border-4 border-foreground bg-card p-6 md:p-8 shadow-[8px_8px_0px_0px_var(--color-primary)]">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter flex items-center gap-3 mb-6 border-b-4 border-foreground pb-4">
                <Zap className="h-6 w-6 text-orange-500 fill-orange-500" /> Requires Action
              </h2>
              <div className="flex flex-col gap-4">
                 {actionItems.map(action => (
                   <div key={action.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 md:p-5 border-2 transition-colors ${action.urgency === 'high' ? 'border-red-500 bg-red-50 hover:bg-red-100' : 'border-foreground bg-background hover:bg-muted'}`}>
                     <div className="flex flex-col gap-2">
                       <span className="font-black uppercase text-sm md:text-base flex items-center gap-2">
                         {action.urgency === 'high' && <span className="h-3 w-3 rounded-none bg-red-500 animate-pulse border border-red-900 shadow-[1px_1px_0px_0px_var(--color-primary)]"></span>}
                         {action.title}
                       </span>
                       <span className="text-[11px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">{action.desc}</span>
                     </div>
                     <button className={`border-2 px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all shadow-[2px_2px_0px_0px_var(--color-foreground)] active:translate-y-[2px] active:shadow-none w-full sm:w-auto ${action.urgency === 'high' ? 'border-red-900 bg-red-500 text-white hover:bg-red-600 shadow-[2px_2px_0px_0px_#7f1d1d]' : 'border-foreground bg-foreground text-background hover:bg-primary hover:text-primary-foreground hover:border-primary'}`}>
                       {action.action}
                     </button>
                   </div>
                 ))}
              </div>
           </div>

           {/* Revenue Snapshot Mock Chart */}
           <div className="border-4 border-foreground bg-card p-6 md:p-8 shadow-[8px_8px_0px_0px_var(--color-foreground)]">
              <div className="flex items-center justify-between border-b-4 border-foreground pb-4 mb-6">
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <BarChart3 className="h-6 w-6 text-primary" /> Last 7 Days Revenue
                </h2>
                <span className="text-xl md:text-2xl font-black text-primary bg-primary/10 px-3 py-1 border-2 border-primary">15.8M ₫</span>
              </div>
              
              {/* CSS Brutalist Bar Chart */}
              <div className="flex items-end justify-between gap-2 h-48 mt-8 px-2 md:px-6">
                 {[40, 60, 30, 80, 50, 90, 75].map((height, i) => (
                   <div key={i} className="w-full flex justify-end flex-col items-center gap-2 group h-full">
                      <div className="text-[10px] md:text-xs font-black opacity-0 group-hover:opacity-100 transition-opacity text-primary bg-background border-2 border-primary px-1 -translate-y-2 absolute z-10">{height * 10}k</div>
                      <div 
                        className={`w-full max-w-[40px] md:max-w-[48px] border-2 border-foreground transition-all duration-500 ease-out shadow-[2px_2px_0px_0px_var(--color-primary)] group-hover:-translate-y-1 ${i === 6 ? 'bg-primary' : 'bg-primary/20 hover:bg-primary/40'}`}
                        style={{ height: `${height}%` }}
                      ></div>
                      <div className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
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
          <div className="border-4 border-foreground bg-primary text-primary-foreground p-6 md:p-8 shadow-[8px_8px_0px_0px_var(--color-foreground)] relative overflow-hidden group">
             <div className="absolute -right-10 -top-10 h-32 w-32 bg-foreground/10 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out z-0"></div>
             
             <h2 className="text-xl md:text-2xl font-black uppercase mb-3 flex items-center gap-2 tracking-tighter relative z-10">
               <QrCode className="h-6 w-6 md:h-8 md:w-8 bg-foreground text-primary p-1" /> Quick Scan
             </h2>
             <p className="text-xs md:text-sm mb-6 font-bold opacity-90 relative z-10 leading-relaxed uppercase tracking-wider">Process walk-ins or verify bookings instantly.</p>
             
             <Link href={`/${locale}/partner/scanner`}>
               <button className="w-full bg-background text-foreground border-4 border-foreground py-3.5 text-xs md:text-sm font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all flex justify-center items-center gap-2 relative z-10 shadow-sm active:translate-y-1">
                 <Search className="h-4 w-4 md:h-5 md:w-5" /> Open Camera
               </button>
             </Link>
          </div>

          {/* Activity Logs */}
          <div className="flex flex-col border-4 border-foreground bg-card shadow-[4px_4px_0px_0px_var(--color-primary)]">
             <div className="flex items-center justify-between border-b-4 border-foreground p-4 bg-muted/20">
               <h2 className="text-sm md:text-base font-black uppercase tracking-widest flex items-center gap-2">
                 <Activity className="h-4 w-4 md:h-5 md:w-5 text-primary" /> Live Feed
               </h2>
               <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest bg-background border-2 border-border px-1.5 py-0.5">Auto-sync</span>
             </div>
             
             <div className="flex flex-col">
               {activityFeed.map((item, i) => (
                 <div key={item.id} className={`flex gap-3 p-4 border-b-2 transition-colors ${i === 0 ? 'border-primary bg-primary/5 hover:bg-primary/10' : 'border-border bg-card hover:bg-muted/50'} ${i === activityFeed.length - 1 ? 'border-b-0' : ''}`}>
                    <div className="pt-0.5 shrink-0">
                      {item.type === 'check-in' && <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-[#84cc16]" />}
                      {item.type === 'booking' && <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-blue-500 fill-blue-500 text-white" />}
                      {item.type === 'check-out' && <Check className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground font-black" />}
                      {item.type === 'system' && <Clock className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className={`text-[11px] md:text-xs font-black uppercase tracking-wider leading-tight ${i === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{item.text}</span>
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">{item.time}</span>
                    </div>
                 </div>
               ))}
             </div>
             <button className="text-[10px] md:text-xs font-black uppercase tracking-widest text-foreground bg-primary/20 hover:bg-primary hover:text-primary-foreground border-t-2 border-foreground transition-all text-center py-3">View Full Logs →</button>
          </div>
        </div>

      </div>
    </div>
  )
}

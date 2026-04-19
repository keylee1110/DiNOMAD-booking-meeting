"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { CalendarCheck, Search, Filter, Users, MapPin, Check, X, LogIn, LogOut, Clock } from "lucide-react"

export default function SchedulePage() {
  const { t } = useTranslation()
  const [filterMode, setFilterMode] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const [bookings, setBookings] = useState([
    { id: "BK012", time: "14:30 - 16:30", room: "Solo Nook A", customer: "Nguyen Van A", status: "confirmed" },
    { id: "BK013", time: "15:00 - 18:00", room: "Team Hub B", customer: "Tran Thi B", status: "arriving" },
    { id: "BK014", time: "16:00 - 17:00", room: "Solo Nook C", customer: "Le Van C", status: "pending" },
    { id: "BK015", time: "13:00 - 15:00", room: "Solo Nook B", customer: "Hoang Van E", status: "in-progress" },
    { id: "BK016", time: "18:00 - 20:00", room: "Team Hub B", customer: "Pham Minh D", status: "confirmed" },
  ])

  const handleStatusChange = (id: string, newStatus: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b))
  }

  const filteredBookings = bookings.filter(b => {
    const matchesTab = filterMode === 'all' || b.status === filterMode
    const matchesSearch = !searchQuery || 
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.room.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const tabs = [
    { id: 'all', label: `All (${bookings.length})` },
    { id: 'arriving', label: `Arriving (${bookings.filter(b => b.status === 'arriving').length})` },
    { id: 'in-progress', label: `Active (${bookings.filter(b => b.status === 'in-progress').length})` },
    { id: 'confirmed', label: `Confirmed (${bookings.filter(b => b.status === 'confirmed').length})` },
    { id: 'pending', label: `Pending (${bookings.filter(b => b.status === 'pending').length})` },
    { id: 'completed', label: `Done (${bookings.filter(b => b.status === 'completed').length})` }
  ]

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-5xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
             <CalendarCheck className="h-8 w-8 text-primary hidden md:block" /> Schedule
          </h1>
          <p className="border-l-4 border-primary pl-3 text-sm md:text-base font-medium text-muted-foreground">
            Manage your daily booking pipeline, prepare rooms, and process check-ins in real-time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex items-center group">
            <Search className="absolute left-4 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search ID, Name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/50 dark:bg-muted/30 border border-white/60 dark:border-border/50 pl-11 pr-4 py-2.5 font-medium text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all w-48 md:w-64 shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 font-semibold text-sm rounded-xl hover:bg-primary/90 transition-colors shadow-sm active:-translate-y-0.5">
             <Filter className="h-4 w-4" /> Filter
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar border-b-2 border-border">
         {tabs.map(tab => (
           <button 
             key={tab.id}
             onClick={() => setFilterMode(tab.id)}
             className={`px-4 py-2 font-bold text-sm whitespace-nowrap transition-colors border-b-2 ${filterMode === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'}`}
           >
             {tab.label}
           </button>
         ))}
      </div>

      <div className="flex flex-col gap-4">
        {filteredBookings.map((b) => (
          <div key={b.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 rounded-2xl border transition-all hover:shadow-md ${b.status === 'in-progress' ? 'border-primary/50 bg-primary/5 shadow-sm' : b.status === 'completed' || b.status === 'cancelled' ? 'border-white/20 dark:border-white/5 bg-white/20 dark:bg-muted/10 opacity-70 hover:opacity-100' : 'border-white/50 dark:border-white/10 bg-white/60 dark:bg-card/60 backdrop-blur-xl shadow-sm'} gap-4 md:gap-6 group`}>
            {/* Left Info Group */}
            <div className="flex items-start gap-4 md:gap-5">
              <div className={`p-3 md:px-4 md:py-3 rounded-xl font-bold text-sm md:text-base whitespace-nowrap transition-colors flex flex-col items-center justify-center ${b.status === 'in-progress' ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' : b.status === 'completed' || b.status === 'cancelled' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'}`}>
                 <span>{b.time.split(' - ')[0]}</span>
                 <span className="text-[10px] md:text-xs opacity-80 mt-0.5">{b.time.split(' - ')[1]}</span>
              </div>
              <div className="flex flex-col gap-1 mt-0.5">
                <span className={`font-semibold text-base md:text-lg tracking-tight ${b.status === 'completed' || b.status === 'cancelled' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{b.room}</span>
                <span className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium mt-0.5">
                  <Users className="h-4 w-4 text-primary" /> {b.customer} 
                </span>
                <span className="text-xs font-semibold flex items-center gap-1.5 mt-1 bg-white/50 dark:bg-muted/30 px-2 py-1 rounded-md text-muted-foreground w-max shadow-sm border border-black/5">
                  <MapPin className="h-3 w-3" /> {b.id} • 2 Guests
                </span>
              </div>
            </div>
            
            {/* Actions Group */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:self-center mt-2 md:mt-0 w-full md:w-auto">
               
               {/* Status Badge */}
               <span className={`px-3 py-1.5 rounded-lg text-xs font-bold self-start md:self-center flex items-center justify-center min-w-[100px] shadow-sm border border-black/5 ${
                  b.status === 'confirmed' ? 'text-blue-700 bg-blue-100 dark:bg-blue-500/20 dark:text-blue-400' : 
                  b.status === 'arriving' ? 'text-orange-700 bg-orange-100 dark:bg-orange-500/20 dark:text-orange-400' :
                  b.status === 'in-progress' ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400' :
                  b.status === 'cancelled' ? 'text-red-700 bg-red-100 dark:bg-red-500/20 dark:text-red-400' :
                  b.status === 'completed' ? 'text-gray-700 bg-gray-200 dark:bg-gray-500/20 dark:text-gray-400' :
                  'text-muted-foreground bg-muted border-border'
               }`}>
                 {b.status.charAt(0).toUpperCase() + b.status.slice(1).replace('-', ' ')}
               </span>
               
               {/* Action Buttons */}
               <div className="flex gap-2 w-full sm:w-auto">
                 {b.status === 'pending' && (
                   <>
                     <button onClick={() => handleStatusChange(b.id, 'confirmed')} className="flex-1 sm:flex-none w-full sm:w-[120px] bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shadow-sm focus:ring-4 focus:ring-primary/20 flex items-center justify-center gap-1.5 active:-translate-y-0.5">
                       <Check className="h-4 w-4" /> Confirm
                     </button>
                     <button onClick={() => handleStatusChange(b.id, 'cancelled')} className="flex-1 sm:flex-none w-full sm:w-[120px] bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shadow-sm focus:ring-4 focus:ring-red-500/20 flex items-center justify-center gap-1.5 active:-translate-y-0.5">
                       <X className="h-4 w-4" /> Reject
                     </button>
                   </>
                 )}

                 {b.status === 'confirmed' && (
                   <button onClick={() => handleStatusChange(b.id, 'arriving')} className="w-full sm:w-[140px] bg-white/60 dark:bg-muted/50 text-foreground hover:bg-white dark:hover:bg-muted rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shadow-sm border border-white/50 dark:border-white/10 flex items-center justify-center gap-1.5 active:-translate-y-0.5">
                     <Clock className="h-4 w-4" /> Arriving
                   </button>
                 )}

                 {b.status === 'arriving' && (
                   <button onClick={() => handleStatusChange(b.id, 'in-progress')} className="w-full sm:w-[140px] bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shadow-sm focus:ring-4 focus:ring-primary/20 flex items-center justify-center gap-1.5 active:-translate-y-0.5">
                     <LogIn className="h-4 w-4" /> Check-in
                   </button>
                 )}

                 {b.status === 'in-progress' && (
                   <button onClick={() => handleStatusChange(b.id, 'completed')} className="w-full sm:w-[140px] bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all shadow-sm focus:ring-4 focus:ring-emerald-500/20 flex items-center justify-center gap-1.5 active:-translate-y-0.5">
                     <LogOut className="h-4 w-4" /> Check-out
                   </button>
                 )}

               </div>
            </div>
          </div>
        ))}

        {filteredBookings.length === 0 && (
          <div className="p-12 border border-white/50 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center text-center bg-white/40 dark:bg-muted/10 h-48 backdrop-blur-sm">
            <span className="text-muted-foreground font-bold text-lg mb-2">No bookings found</span>
            <span className="text-muted-foreground text-xs font-medium bg-white/60 dark:bg-muted/30 px-3 py-1.5 rounded-lg shadow-sm border border-black/5">Try checking a different status tab</span>
          </div>
        )}
      </div>
    </div>
  )
}

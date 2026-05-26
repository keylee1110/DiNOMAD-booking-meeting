"use client"

import { useState } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { CalendarCheck, Search, Filter, Users, MapPin, Check, X, LogIn, LogOut, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

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
             <CalendarCheck className="h-8 w-8 text-primary hidden md:block" /> Today's Schedule
          </h1>
          <p className="text-base text-muted-foreground">
            Manage your daily booking pipeline, prepare rooms, and process check-ins in real-time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search ID, Name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl border border-border/85 bg-background pl-9 pr-4 py-2 font-semibold text-xs md:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent transition-all w-48 md:w-64"
            />
          </div>
          <button className="flex items-center gap-2 bg-secondary text-secondary-foreground border border-border hover:bg-muted/80 px-4 py-2 font-semibold text-xs md:text-sm transition-all rounded-xl shadow-sm h-[#40px] md:h-[42px]">
             <Filter className="h-4 w-4" /> Filter
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar border-b border-border/40">
         {tabs.map(tab => (
           <button 
             key={tab.id}
             onClick={() => setFilterMode(tab.id)}
             className={`px-4 py-2 font-semibold text-xs md:text-sm whitespace-nowrap transition-colors border-b-2 ${filterMode === tab.id ? 'border-primary text-foreground bg-primary/10' : 'border-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground'}`}
           >
             {tab.label}
           </button>
         ))}
      </div>

      <div className="flex flex-col gap-4">
        {filteredBookings.map((b) => (
          <div key={b.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 rounded-2xl border ${
            b.status === 'in-progress' 
              ? 'border-primary/40 bg-primary/5 shadow-sm' 
              : b.status === 'completed' || b.status === 'cancelled' 
                ? 'border-border/40 bg-muted/20 opacity-70 shadow-none hover:opacity-100' 
                : 'border-border/50 bg-card shadow-[0_4px_20px_-4px_rgba(41,35,30,0.04)]'
          } hover:-translate-y-0.5 transition-all gap-4 md:gap-6 group`}>
            {/* Left Info Group */}
            <div className="flex items-start gap-4 md:gap-6">
              <div className={`p-2.5 md:px-3 md:py-2.5 rounded-xl border font-semibold text-sm md:text-base whitespace-nowrap transition-colors flex flex-col items-center justify-center min-w-[70px] ${
                b.status === 'in-progress' 
                  ? 'bg-primary text-primary-foreground border-transparent' 
                  : 'bg-muted border-border/60 text-muted-foreground'
              }`}>
                 <span className="font-bold">{b.time.split(' - ')[0]}</span>
                 <span className="text-[10px] opacity-80 mt-0.5">{b.time.split(' - ')[1]}</span>
              </div>
              <div className="flex flex-col gap-1 mt-0.5">
                <span className={`font-semibold text-base md:text-lg tracking-tight ${b.status === 'completed' || b.status === 'cancelled' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{b.room}</span>
                <span className="text-sm text-foreground flex items-center gap-1.5 font-semibold mt-1">
                  <Users className="h-4 w-4 text-primary" /> {b.customer} 
                </span>
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-1 bg-background px-2.5 py-1 rounded-lg border border-border/60 w-max shadow-sm">
                  <MapPin className="h-3 w-3" /> {b.id} • 2 Guests
                </span>
              </div>
            </div>
            
            {/* Actions Group */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:self-center mt-2 md:mt-0 w-full lg:w-auto overflow-hidden">
               
               {/* Status Badge */}
               <span className={`px-3.5 py-1 border rounded-full text-[10px] md:text-xs font-semibold tracking-tight uppercase self-start md:self-center flex items-center justify-center min-w-[100px] text-center ${
                  b.status === 'confirmed' ? 'border-primary/20 text-primary bg-primary/10' : 
                  b.status === 'arriving' ? 'border-orange-500/20 text-orange-600 bg-orange-500/5' :
                  b.status === 'in-progress' ? 'border-emerald-500/20 text-emerald-700 bg-emerald-500/5' :
                  b.status === 'cancelled' ? 'border-destructive/20 text-destructive bg-destructive/5' :
                  b.status === 'completed' ? 'border-border/40 text-muted-foreground bg-muted' :
                  'border-border text-muted-foreground bg-background'
               }`}>
                 {b.status}
               </span>
               
               {/* Action Buttons */}
               <div className="flex gap-3 w-full sm:w-auto">
                 {b.status === 'pending' && (
                   <>
                     <Button onClick={() => handleStatusChange(b.id, 'confirmed')} className="font-semibold rounded-xl w-full sm:w-[130px] shadow-sm flex items-center justify-center gap-1.5">
                       <Check className="h-4 w-4" /> Confirm
                     </Button>
                     <Button onClick={() => handleStatusChange(b.id, 'cancelled')} variant="destructive" className="font-semibold rounded-xl w-full sm:w-[130px] shadow-sm flex items-center justify-center gap-1.5">
                       <X className="h-4 w-4" /> Reject
                     </Button>
                   </>
                 )}

                 {b.status === 'confirmed' && (
                   <Button onClick={() => handleStatusChange(b.id, 'arriving')} variant="outline" className="font-semibold rounded-xl w-full sm:w-[160px] shadow-sm bg-transparent border-border hover:bg-muted/80 flex items-center justify-center gap-1.5">
                     <Clock className="h-4 w-4" /> Arriving
                   </Button>
                 )}

                 {b.status === 'arriving' && (
                   <Button onClick={() => handleStatusChange(b.id, 'in-progress')} className="font-semibold rounded-xl w-full sm:w-[160px] shadow-sm flex items-center justify-center gap-1.5">
                     <LogIn className="h-4 w-4" /> Check-in
                   </Button>
                 )}

                 {b.status === 'in-progress' && (
                   <Button onClick={() => handleStatusChange(b.id, 'completed')} className="font-semibold rounded-xl w-full sm:w-[160px] shadow-sm bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-1.5">
                     <LogOut className="h-4 w-4" /> Check-out
                   </Button>
                 )}

               </div>
            </div>
          </div>
        ))}

        {filteredBookings.length === 0 && (
          <div className="p-12 rounded-2xl border-2 border-dashed border-border/80 flex flex-col items-center justify-center text-center bg-muted/10 h-48">
            <span className="text-muted-foreground font-semibold text-lg md:text-xl mb-2">No bookings found</span>
            <span className="text-muted-foreground text-xs md:text-sm font-semibold tracking-tight bg-background px-4 py-2 rounded-xl border border-border/80 shadow-sm">Try checking a different status tab</span>
          </div>
        )}
      </div>
    </div>
  )
}

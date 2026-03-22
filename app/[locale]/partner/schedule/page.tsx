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
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter flex items-center gap-3">
             <CalendarCheck className="h-8 w-8 text-primary hidden md:block" /> Today's Schedule
          </h1>
          <p className="border-l-4 border-primary pl-3 text-sm md:text-base font-medium text-muted-foreground">
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
              className="border-2 border-foreground bg-background pl-9 pr-4 py-2 font-black uppercase tracking-wider text-xs md:text-sm shadow-[2px_2px_0px_0px_var(--color-foreground)] focus:outline-none focus:border-primary focus:shadow-[2px_2px_0px_0px_var(--color-primary)] transition-all w-48 md:w-64"
            />
          </div>
          <button className="flex items-center gap-2 bg-foreground text-background border-2 border-foreground px-4 py-2 font-black uppercase tracking-wider text-xs md:text-sm hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors shadow-[2px_2px_0px_0px_var(--color-primary)] active:translate-y-[2px] active:shadow-none h-[#40px] md:h-[42px]">
             <Filter className="h-4 w-4" /> Filter
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar border-b-2 border-border">
         {tabs.map(tab => (
           <button 
             key={tab.id}
             onClick={() => setFilterMode(tab.id)}
             className={`px-4 py-2 font-black uppercase tracking-wider text-xs md:text-sm whitespace-nowrap transition-colors border-b-4 ${filterMode === tab.id ? 'border-primary text-foreground bg-primary/10' : 'border-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground'}`}
           >
             {tab.label}
           </button>
         ))}
      </div>

      <div className="flex flex-col gap-4">
        {filteredBookings.map((b) => (
          <div key={b.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 border-2 ${b.status === 'in-progress' ? 'border-primary bg-primary/5 shadow-[4px_4px_0px_0px_var(--color-primary)]' : b.status === 'completed' || b.status === 'cancelled' ? 'border-border bg-muted/30 opacity-70 shadow-none hover:opacity-100' : 'border-foreground bg-card shadow-[4px_4px_0px_0px_var(--color-foreground)]'} hover:-translate-y-1 transition-transform gap-4 md:gap-6 group`}>
            {/* Left Info Group */}
            <div className="flex items-start gap-4 md:gap-6">
              <div className={`p-3 md:px-4 md:py-3 border-2 font-black uppercase text-sm md:text-base whitespace-nowrap transition-colors flex flex-col items-center justify-center ${b.status === 'in-progress' ? 'bg-primary text-primary-foreground border-primary' : b.status === 'completed' || b.status === 'cancelled' ? 'bg-muted border-border text-muted-foreground' : 'bg-primary/10 text-primary border-primary group-hover:bg-primary group-hover:text-primary-foreground'}`}>
                 <span>{b.time.split(' - ')[0]}</span>
                 <span className="text-[10px] opacity-80 mt-1">{b.time.split(' - ')[1]}</span>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <span className={`font-black uppercase text-base md:text-lg tracking-wide ${b.status === 'completed' || b.status === 'cancelled' ? 'line-through text-muted-foreground' : ''}`}>{b.room}</span>
                <span className="text-sm text-foreground flex items-center gap-1.5 font-bold mt-1">
                  <Users className="h-4 w-4 text-primary" /> {b.customer} 
                </span>
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5 bg-background px-2 py-1 border border-border w-max">
                  <MapPin className="h-3 w-3" /> {b.id} • 2 Guests
                </span>
              </div>
            </div>
            
            {/* Actions Group */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:self-center mt-2 md:mt-0 w-full lg:w-auto overflow-hidden">
               
               {/* Status Badge */}
               <span className={`px-4 py-2 border-2 text-[10px] md:text-xs font-black uppercase tracking-widest self-start md:self-center flex items-center justify-center min-w-[110px] text-center ${
                  b.status === 'confirmed' ? 'border-primary text-primary bg-primary/10' : 
                  b.status === 'arriving' ? 'border-orange-500 text-orange-600 bg-orange-500/10' :
                  b.status === 'in-progress' ? 'border-[#C1FF72] text-foreground bg-[#C1FF72]/20' :
                  b.status === 'cancelled' ? 'border-red-500 text-red-600 bg-red-500/10' :
                  b.status === 'completed' ? 'border-foreground/30 text-foreground/50 bg-background' :
                  'border-border text-muted-foreground bg-background'
               }`}>
                 {b.status}
               </span>
               
               {/* Action Buttons */}
               <div className="flex gap-3 w-full sm:w-auto">
                 {b.status === 'pending' && (
                   <>
                     <button onClick={() => handleStatusChange(b.id, 'confirmed')} className="flex-1 sm:flex-none w-full sm:w-[130px] border-2 border-foreground bg-primary text-primary-foreground hover:bg-foreground hover:border-foreground px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_var(--color-foreground)] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-1.5">
                       <Check className="h-4 w-4" /> Confirm
                     </button>
                     <button onClick={() => handleStatusChange(b.id, 'cancelled')} className="flex-1 sm:flex-none w-full sm:w-[130px] border-2 border-foreground bg-background text-red-600 hover:bg-red-500 hover:text-white px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_var(--color-foreground)] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-1.5">
                       <X className="h-4 w-4" /> Reject
                     </button>
                   </>
                 )}

                 {b.status === 'confirmed' && (
                   <button onClick={() => handleStatusChange(b.id, 'arriving')} className="w-full sm:w-[160px] border-2 border-foreground bg-background text-foreground hover:bg-muted px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_var(--color-foreground)] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-1.5">
                     <Clock className="h-4 w-4" /> Arriving
                   </button>
                 )}

                 {b.status === 'arriving' && (
                   <button onClick={() => handleStatusChange(b.id, 'in-progress')} className="w-full sm:w-[160px] border-2 border-foreground bg-foreground text-background hover:bg-primary hover:text-primary-foreground px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_var(--color-foreground)] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-1.5">
                     <LogIn className="h-4 w-4" /> Check-in
                   </button>
                 )}

                 {b.status === 'in-progress' && (
                   <button onClick={() => handleStatusChange(b.id, 'completed')} className="w-full sm:w-[160px] border-2 border-foreground bg-[#C1FF72] text-foreground hover:bg-[#a5db5c] px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all shadow-[2px_2px_0px_0px_var(--color-foreground)] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-1.5">
                     <LogOut className="h-4 w-4" /> Check-out
                   </button>
                 )}

               </div>
            </div>
          </div>
        ))}

        {filteredBookings.length === 0 && (
          <div className="p-12 border-4 border-dashed border-border flex flex-col items-center justify-center text-center bg-muted/10 h-48">
            <span className="text-muted-foreground font-black uppercase text-xl md:text-2xl mb-2">No bookings found</span>
            <span className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest bg-background px-4 py-2 border-2 border-border">Try checking a different status tab</span>
          </div>
        )}
      </div>
    </div>
  )
}

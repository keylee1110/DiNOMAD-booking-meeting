"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Lock, Check, X } from "lucide-react"
import { generateTimeSlots } from "@/lib/data/time-slots"
import { getNextDays } from "@/lib/format"
import type { TimeSlot } from "@/lib/types"

export function InventoryToggle({ roomId = "1", roomName = "Room A" }) {
  const [expanded, setExpanded] = useState(false)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  // Fetch slots on client to avoid hydration mismatch with local dates
  useEffect(() => {
    const today = getNextDays(1)[0]
    setSlots(generateTimeSlots(today, roomId))
  }, [roomId])

  const toggleSelection = (slotId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(slotId)) next.delete(slotId)
      else next.add(slotId)
      return next
    })
  }

  const applyStatusToSelected = (makeAvailable: boolean) => {
    setSlots(current => 
      current.map(s => selectedIds.has(s.id) ? { ...s, available: makeAvailable } : s)
    )
    setSelectedIds(new Set())
  }

  const availableCount = slots.filter(s => s.available).length
  const totalCount = slots.length

  return (
    <div className="flex flex-col gap-0 border-2 border-foreground bg-card shadow-[4px_4px_0px_0px_var(--color-foreground)] transition-all">
      <button 
        onClick={() => {
           setExpanded(!expanded)
           // Clear selection when closing
           if (expanded) setSelectedIds(new Set())
        }}
        className="flex items-center justify-between p-3 md:p-4 bg-background hover:bg-muted transition-colors border-b-2 border-transparent"
      >
         <span className="font-black uppercase tracking-wider text-xs md:text-sm">{roomName}</span>
         <div className="flex items-center gap-3">
           <span className={`px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase tracking-wider border-2 ${availableCount > 0 ? 'bg-[#C1FF72] text-foreground border-foreground' : 'bg-red-500 text-white border-red-900'}`}>
              {totalCount === 0 ? "Loading..." : `${availableCount}/${totalCount} Slots`}
           </span>
           {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
         </div>
      </button>
      
      {expanded && (
        <div className="p-3 md:p-4 border-t-2 border-foreground bg-muted/20 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 border-b-2 border-border pb-3 gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-1.5 bg-primary/10 text-primary border-2 border-primary px-2 py-1">
               <Lock className="h-3.5 w-3.5" /> Strict Mode
            </span>
            <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">
               1. Select slots &nbsp;&nbsp; 2. Apply action
            </span>
          </div>
          
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
            {slots.map(slot => {
              const isSelected = selectedIds.has(slot.id)
              return (
                <button
                  key={slot.id}
                  onClick={() => toggleSelection(slot.id)}
                  className={`p-1.5 md:p-2 border-2 transition-all flex flex-col items-center justify-center gap-1 shadow-sm active:translate-y-0 ${
                    isSelected 
                      ? "bg-foreground text-background border-foreground scale-105" 
                      : slot.available 
                        ? "bg-[#C1FF72]/10 border-[#C1FF72]/50 hover:border-foreground text-foreground" 
                        : "bg-red-500/10 text-red-950 border-red-900/30 hover:border-red-900"
                  }`}
                >
                  <span className="text-[10px] md:text-[11px] font-black block">{slot.startTime}</span>
                  {!isSelected && (
                    <span className="text-[8px] font-bold uppercase tracking-wider opacity-60 block">
                      {slot.available ? "Avail" : "Busy"}
                    </span>
                  )}
                  {isSelected && (
                    <span className="text-[8px] font-black uppercase text-primary tracking-wider block">Selected</span>
                  )}
                </button>
              )
            })}
          </div>

          {selectedIds.size > 0 && (
            <div className="mt-4 pt-3 border-t-2 border-border flex flex-col sm:flex-row items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
              <span className="text-xs font-black uppercase text-foreground mr-auto border-b-2 border-primary">
                {selectedIds.size} Selected
              </span>
              <div className="w-full sm:w-auto flex gap-2">
                <button 
                  onClick={() => applyStatusToSelected(true)}
                  className="flex-1 sm:flex-none bg-[#C1FF72] text-foreground border-2 border-foreground hover:bg-[#a5db5c] px-3 md:px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-wider transition-colors flex justify-center items-center gap-1.5 shadow-[2px_2px_0px_0px_var(--color-foreground)] active:translate-y-[2px] active:shadow-none whitespace-nowrap"
                >
                   <Check className="h-3.5 w-3.5" /> Set Avail
                </button>
                <button 
                  onClick={() => applyStatusToSelected(false)}
                  className="flex-1 sm:flex-none bg-red-500 text-white border-2 border-red-900 hover:bg-red-600 px-3 md:px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-wider transition-colors flex justify-center items-center gap-1.5 shadow-[2px_2px_0px_0px_var(--color-foreground)] active:translate-y-[2px] active:shadow-none whitespace-nowrap"
                >
                   <X className="h-3.5 w-3.5" /> Set Busy
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

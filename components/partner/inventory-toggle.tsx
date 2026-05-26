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
    const timer = setTimeout(() => {
      setSlots(generateTimeSlots(today, roomId))
    }, 0)
    return () => clearTimeout(timer)
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
    <div className="flex flex-col gap-0 border border-border/50 bg-card rounded-2xl overflow-hidden shadow-sm transition-all">
      <button 
        onClick={() => {
           setExpanded(!expanded)
           // Clear selection when closing
           if (expanded) setSelectedIds(new Set())
        }}
        className="flex items-center justify-between p-4 bg-background/50 hover:bg-muted/40 transition-colors border-b border-transparent"
      >
         <span className="font-semibold text-sm tracking-tight text-foreground">{roomName}</span>
         <div className="flex items-center gap-3">
           <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
             availableCount > 0 
               ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
               : 'bg-destructive/10 text-destructive border-destructive/20'
           }`}>
              {totalCount === 0 ? "Loading..." : `${availableCount}/${totalCount} Slots`}
           </span>
           {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
         </div>
      </button>
      
      {expanded && (
        <div className="p-4 border-t border-border/40 bg-muted/10 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 border-b border-border/40 pb-3 gap-2">
            <span className="text-xs font-semibold tracking-tight text-primary flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1">
               <Lock className="h-3.5 w-3.5" /> Strict Mode
            </span>
            <span className="text-xs font-medium text-muted-foreground tracking-tight">
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
                  className={`p-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 duration-200 ${
                    isSelected 
                      ? "bg-primary text-primary-foreground border-transparent scale-[1.03]" 
                      : slot.available 
                        ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50 text-foreground" 
                        : "bg-destructive/5 text-destructive/80 border-destructive/20 hover:border-destructive/50"
                  }`}
                >
                  <span className="text-[10px] md:text-[11px] font-semibold block">{slot.startTime}</span>
                  {!isSelected && (
                    <span className="text-[8px] font-medium uppercase tracking-wider opacity-60 block">
                      {slot.available ? "Avail" : "Busy"}
                    </span>
                  )}
                  {isSelected && (
                    <span className="text-[8px] font-semibold uppercase tracking-wider block">Selected</span>
                  )}
                </button>
              )
            })}
          </div>

          {selectedIds.size > 0 && (
            <div className="mt-4 pt-3.5 border-t border-border/40 flex flex-col sm:flex-row items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
              <span className="text-xs font-semibold text-foreground mr-auto">
                {selectedIds.size} Selected
              </span>
              <div className="w-full sm:w-auto flex gap-2">
                <button 
                  onClick={() => applyStatusToSelected(true)}
                  className="flex-1 sm:flex-none bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm flex justify-center items-center gap-1.5 active:scale-[0.98] duration-200"
                >
                   <Check className="h-3.5 w-3.5" /> Set Avail
                </button>
                <button 
                  onClick={() => applyStatusToSelected(false)}
                  className="flex-1 sm:flex-none bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm flex justify-center items-center gap-1.5 active:scale-[0.98] duration-200"
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

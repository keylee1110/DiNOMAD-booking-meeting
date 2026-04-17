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
    <div className="flex flex-col gap-0 border border-white/40 dark:border-white/10 bg-white/40 dark:bg-muted/10 rounded-2xl overflow-hidden transition-all shadow-sm">
      <button 
        onClick={() => {
           setExpanded(!expanded)
           // Clear selection when closing
           if (expanded) setSelectedIds(new Set())
        }}
        className="flex items-center justify-between p-4 md:p-5 bg-white/50 dark:bg-muted/20 hover:bg-white/80 dark:hover:bg-muted/30 transition-colors border-b border-transparent backdrop-blur-sm"
      >
         <span className="font-bold text-sm md:text-base">{roomName}</span>
         <div className="flex items-center gap-3">
           <span className={`px-2.5 py-1 text-[10px] md:text-xs font-bold rounded-lg shadow-sm border border-black/5 ${availableCount > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
              {totalCount === 0 ? "Loading..." : `${availableCount}/${totalCount} Slots`}
           </span>
           {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
         </div>
      </button>
      
      {expanded && (
        <div className="p-4 md:p-5 border-t border-white/40 dark:border-white/10 bg-white/30 dark:bg-transparent animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 border-b border-border pb-4 gap-3">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5 bg-primary/10 rounded-lg px-2.5 py-1.5 border border-primary/20 shadow-sm">
               <Lock className="h-3.5 w-3.5" /> Strict Mode
            </span>
            <span className="text-xs font-medium text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border">
               1. Select slots &nbsp;&nbsp; 2. Apply action
            </span>
          </div>
          
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {slots.map(slot => {
              const isSelected = selectedIds.has(slot.id)
              return (
                <button
                  key={slot.id}
                  onClick={() => toggleSelection(slot.id)}
                  className={`p-2.5 md:p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 hover:-translate-y-0.5 ${
                    isSelected 
                      ? "bg-primary text-primary-foreground border-primary shadow-md opacity-100" 
                      : slot.available 
                        ? "bg-emerald-50/50 border-emerald-200 hover:border-emerald-300 dark:bg-emerald-900/10 dark:border-emerald-900/30 text-foreground" 
                        : "bg-red-50/50 text-red-900 border-red-200 dark:bg-red-900/10 dark:border-red-900/50 dark:text-red-200 opacity-60 hover:opacity-100"
                  }`}
                >
                  <span className="text-xs md:text-sm font-bold block">{slot.startTime}</span>
                  {!isSelected && (
                    <span className="text-[9px] md:text-[10px] font-semibold uppercase tracking-wider opacity-70 block">
                      {slot.available ? "Avail" : "Busy"}
                    </span>
                  )}
                  {isSelected && (
                    <span className="text-[9px] md:text-[10px] font-bold text-primary-foreground/90 tracking-wider block">Selected</span>
                  )}
                </button>
              )
            })}
          </div>

          {selectedIds.size > 0 && (
            <div className="mt-5 pt-4 border-t border-border flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
              <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 mr-auto">
                {selectedIds.size} Selected
              </span>
              <div className="w-full sm:w-auto flex gap-3">
                <button 
                  onClick={() => applyStatusToSelected(true)}
                  className="flex-1 sm:flex-none bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm focus:ring-4 focus:ring-emerald-500/20 flex justify-center items-center gap-1.5 active:-translate-y-0.5 whitespace-nowrap"
                >
                   <Check className="h-4 w-4" /> Set Avail
                </button>
                <button 
                  onClick={() => applyStatusToSelected(false)}
                  className="flex-1 sm:flex-none bg-red-500 text-white hover:bg-red-600 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm focus:ring-4 focus:ring-red-500/20 flex justify-center items-center gap-1.5 active:-translate-y-0.5 whitespace-nowrap"
                >
                   <X className="h-4 w-4" /> Set Busy
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

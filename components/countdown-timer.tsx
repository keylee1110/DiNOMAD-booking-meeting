"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Timer } from "lucide-react"

interface CountdownTimerProps {
  durationSeconds: number
  onExpire?: () => void
  className?: string
}

export function CountdownTimer({ durationSeconds, onExpire, className }: CountdownTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds)

  const handleExpire = useCallback(() => {
    onExpire?.()
  }, [onExpire])

  useEffect(() => {
    if (secondsLeft <= 0) {
      handleExpire()
      return
    }
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [secondsLeft, handleExpire])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const isUrgent = secondsLeft < 60

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-4 py-2 font-mono text-lg font-bold",
        isUrgent ? "border-destructive bg-destructive/10 text-destructive" : "border-warning bg-warning/10 text-warning-foreground",
        className
      )}
    >
      <Timer className="h-5 w-5" />
      <span>{mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}</span>
    </div>
  )
}

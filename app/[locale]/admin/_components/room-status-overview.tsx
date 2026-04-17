import { rooms } from "@/lib/data/rooms"

export function RoomStatusOverview() {
  return (
    <div className="flex flex-col">
      <div className="px-6 py-5 border-y border-white/40 dark:border-white/10 bg-white/40 dark:bg-muted/10">
        <h3 className="text-lg font-bold text-foreground tracking-tight">Room Status</h3>
      </div>
      <div className="p-6 space-y-4">
        {rooms.slice(0, 4).map((room) => (
          <div key={room.id} className="flex items-center justify-between group p-3 rounded-xl hover:bg-white/50 dark:hover:bg-muted/30 transition-colors border border-transparent hover:border-white/60 dark:hover:border-white/10 cursor-default">
            <span className="font-semibold text-sm text-foreground truncate flex-1 pr-4 transition-colors">
              {room.name}
            </span>
            <span 
              className={`text-xs font-bold px-2.5 py-1 rounded-md shrink-0 border border-black/5 shadow-sm ${
                room.slotsLeftToday > 3 
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" 
                  : room.slotsLeftToday > 0 
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" 
                  : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
              }`}
            >
              {room.slotsLeftToday} slots
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}


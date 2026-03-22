import { rooms } from "@/lib/data/rooms"

export function RoomStatusOverview() {
  return (
    <div className="px-5 py-4 border-t border-border">
      <h3 className="text-sm font-semibold text-foreground mb-3">Room Status Today</h3>
      <div className="space-y-2">
        {rooms.slice(0, 4).map((room) => (
          <div key={room.id} className="flex items-center justify-between text-xs group">
            <span className="text-muted-foreground truncate flex-1 pr-2 group-hover:text-foreground transition-colors">
              {room.name}
            </span>
            <span 
              className={`font-medium shrink-0 ${
                room.slotsLeftToday > 3 
                  ? "text-emerald-500" 
                  : room.slotsLeftToday > 0 
                  ? "text-amber-500" 
                  : "text-red-500"
              }`}
            >
              {room.slotsLeftToday} slots left
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

import { rooms } from "@/lib/data/rooms"
import { CheckCircle2, XCircle, Search, Plus, Star, Users } from "lucide-react"

export default function AdminRoomsPage() {
  const totalRooms = rooms.length
  const verifiedRooms = rooms.filter((r) => r.verified).length
  const pendingRooms = totalRooms - verifiedRooms

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Rooms</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalRooms} rooms across {new Set(rooms.map((r) => r.venueId)).size} venues
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity shrink-0">
          <Plus className="w-4 h-4" />
          Add Room
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 transition-transform">
          <p className="text-3xl font-bold text-foreground tracking-tight">{totalRooms}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Total</p>
        </div>
        <div className="bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 transition-transform">
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{verifiedRooms}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Verified</p>
        </div>
        <div className="bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 transition-transform">
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">{pendingRooms}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Pending</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-sm">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search rooms by name or venue..."
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-white/50 dark:bg-muted/30 border border-white/60 dark:border-border/50 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-foreground placeholder:text-muted-foreground transition-all shadow-sm"
          />
        </div>
        <select className="text-sm bg-white/50 dark:bg-muted/30 border border-white/60 dark:border-border/50 rounded-xl px-4 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto shadow-sm cursor-pointer hover:bg-white/80 transition-colors appearance-none font-medium">
          <option value="">All Districts</option>
          {[...new Set(rooms.map((r) => r.district))].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select className="text-sm bg-white/50 dark:bg-muted/30 border border-white/60 dark:border-border/50 rounded-xl px-4 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto shadow-sm cursor-pointer hover:bg-white/80 transition-colors appearance-none font-medium">
          <option value="">All Status</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Rooms Table */}
      <div className="bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/40 dark:border-white/10 bg-muted/20">
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Room / Venue</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">District</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Capacity</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Price/hr</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Rating</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40 dark:divide-white/10">
              {rooms.map((room, i) => (
                <tr key={room.id} className="hover:bg-white/40 dark:hover:bg-muted/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{room.name}</div>
                    <div className="text-xs font-medium text-muted-foreground mt-0.5">{room.venueName}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-muted-foreground hidden md:table-cell">{room.district}</td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
                      <Users className="w-3.5 h-3.5 text-primary/70" />
                      {room.capacity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-foreground font-semibold hidden lg:table-cell">
                    {room.pricePerHour.toLocaleString("vi-VN")}₫
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 text-amber-500 font-bold bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md text-xs">
                      <Star className="w-3 h-3 fill-current" />
                      {room.rating}
                      <span className="text-muted-foreground font-semibold ml-0.5 opacity-80">({room.reviewCount})</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {room.verified ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm border border-black/5 text-emerald-700 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm border border-black/5 text-amber-700 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400">
                        <XCircle className="w-3.5 h-3.5" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">Edit</button>
                      <span className="text-border/60">·</span>
                      <button className="text-xs font-bold text-destructive hover:text-destructive/80 transition-colors">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

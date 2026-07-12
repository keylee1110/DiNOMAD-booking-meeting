"use client"

import { useEffect, useMemo, useState } from "react"
import { getAdminRooms, archiveAdminRoom, setAdminRoomStatus } from "@/lib/api/admin"
import type { AdminRoom } from "@/lib/types"
import { CheckCircle2, XCircle, Search, Star, Users, Loader2 } from "lucide-react"

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<AdminRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [district, setDistrict] = useState("")
  const [status, setStatus] = useState("")
  useEffect(() => { getAdminRooms().then(setRooms).catch((e) => setError(e.message)).finally(() => setLoading(false)) }, [])
  const filteredRooms = useMemo(() => rooms.filter((room) =>
    (!search || `${room.name} ${room.venueName}`.toLowerCase().includes(search.toLowerCase())) &&
    (!district || room.district === district) && (!status || room.status === status)
  ), [rooms, search, district, status])
  const totalRooms = rooms.length
  const verifiedRooms = rooms.filter((r) => r.status === "published").length
  const pendingRooms = rooms.filter((r) => r.status === "unavailable").length

  const togglePublished = async (room: AdminRoom) => {
    try {
      const updated = await setAdminRoomStatus(room.id, room.status === "published" ? "unavailable" : "published")
      setRooms((current) => current.map((item) => item.id === room.id ? { ...item, ...updated } : item))
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
  }
  const remove = async (room: AdminRoom) => {
    if (!window.confirm(`Archive ${room.name}?`)) return
    try { await archiveAdminRoom(room.id); setRooms((current) => current.filter((item) => item.id !== room.id)) }
    catch (e) { setError(e instanceof Error ? e.message : String(e)) }
  }

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
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalRooms}</p>
          <p className="text-xs text-muted-foreground mt-1">Total</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{verifiedRooms}</p>
          <p className="text-xs text-muted-foreground mt-1">Verified</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingRooms}</p>
          <p className="text-xs text-muted-foreground mt-1">Pending</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms by name or venue..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted border border-border rounded-md outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <select value={district} onChange={(e) => setDistrict(e.target.value)} className="text-sm bg-muted border border-border rounded-md px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring w-full sm:w-auto">
          <option value="">All Districts</option>
          {[...new Set(rooms.map((r) => r.district))].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="text-sm bg-muted border border-border rounded-md px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-ring w-full sm:w-auto">
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      {/* Rooms Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Room / Venue</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">District</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Capacity</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Price/hr</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Rating</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>}
              {!loading && error && <tr><td colSpan={7} className="py-12 text-center text-destructive">{error}</td></tr>}
              {!loading && !error && filteredRooms.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No rooms found</td></tr>}
              {filteredRooms.map((room, i) => (
                <tr key={room.id} className={i < filteredRooms.length - 1 ? "border-b border-border hover:bg-muted/30 transition-colors" : "hover:bg-muted/30 transition-colors"}>
                  <td className="px-5 py-4">
                    <div className="font-medium text-foreground">{room.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{room.venueName}</div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">{room.district}</td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      {room.capacity}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-foreground font-medium hidden lg:table-cell">
                    {room.pricePerHour.toLocaleString("vi-VN")}₫
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 text-amber-500 font-medium">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {room.rating}
                      <span className="text-muted-foreground font-normal text-xs">({room.reviewCount})</span>
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {room.status === "published" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400">
                        <XCircle className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => togglePublished(room)} className="text-xs font-medium text-primary hover:underline">{room.status === "published" ? "Unpublish" : "Publish"}</button>
                      <span className="text-border">·</span>
                      <button onClick={() => remove(room)} className="text-xs font-medium text-destructive hover:underline">Archive</button>
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

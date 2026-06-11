"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "@/lib/i18n/context"
import {
  Building2, Plus, Image as ImageIcon, Check, MapPin, Users, Edit2,
  ArrowLeft, Tags, AlignLeft, DollarSign, LayoutList, Navigation2,
  Info, Trash2, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { formatVND } from "@/lib/format"
import {
  getPartnerVenues, createVenue, updateVenue, createRoom, updateRoom, deleteRoom,
  type ApiVenue,
} from "@/lib/api/partner"
import type { Amenity, VibeTag } from "@/lib/types"

// ─── Local form shape ─────────────────────────────────────────────────────────

interface RoomFormData {
  id: string | null
  venueId: string | null
  name: string
  venueName: string
  address: string
  district: string
  description: string
  capacity: number
  pricePerHour: number
  category: "team_hub" | "solo_nook"
  specs: { size: string; floor: string; view: string }
  amenities: Amenity[]
  vibeTags: VibeTag[]
  status?: string
}

const AMENITY_OPTIONS: { value: Amenity; label: string }[] = [
  { value: "wifi", label: "WiFi" },
  { value: "tv", label: "Smart TV" },
  { value: "whiteboard", label: "Whiteboard" },
  { value: "ac", label: "Air Con" },
  { value: "hdmi", label: "HDMI" },
  { value: "projector", label: "Projector" },
  { value: "power_outlets", label: "Power Outlets" },
  { value: "coffee", label: "Coffee" },
  { value: "water", label: "Water" },
  { value: "parking", label: "Parking" },
]

const VIBE_TAG_OPTIONS: { value: VibeTag; label: string }[] = [
  { value: "ultra_quiet", label: "ultra_quiet" },
  { value: "discussion_friendly", label: "discussion_friendly" },
  { value: "cold_ac", label: "cold_ac" },
  { value: "natural_light", label: "natural_light" },
  { value: "cozy", label: "cozy" },
  { value: "modern", label: "modern" },
  { value: "rooftop", label: "rooftop" },
  { value: "garden_view", label: "garden_view" },
]

const DISTRICTS = ["District 1", "District 2", "District 3", "District 4", "District 5",
  "District 6", "District 7", "District 8", "District 9", "District 10",
  "District 11", "District 12", "Binh Thanh", "Go Vap", "Phu Nhuan",
  "Tan Binh", "Tan Phu", "Thu Duc", "Binh Chanh", "Hoc Mon"]

function flattenVenues(venues: ApiVenue[]): RoomFormData[] {
  return venues.flatMap(v =>
    v.rooms.map(r => ({
      id: r.id,
      venueId: v.id,
      name: r.name,
      venueName: v.name,
      address: v.address,
      district: v.district,
      description: r.description,
      capacity: r.capacity,
      pricePerHour: r.pricePerHour,
      category: r.category,
      specs: {
        size: (r.specs?.size as string) ?? "",
        floor: (r.specs?.floor as string) ?? "",
        view: (r.specs?.view as string) ?? "",
      },
      amenities: r.amenities,
      vibeTags: r.vibeTags,
      status: r.status,
    }))
  )
}

const EMPTY_FORM: RoomFormData = {
  id: null,
  venueId: null,
  name: "",
  venueName: "",
  address: "",
  district: "District 1",
  description: "",
  capacity: 4,
  pricePerHour: 120000,
  category: "team_hub",
  specs: { size: "", floor: "", view: "" },
  amenities: [],
  vibeTags: [],
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VenuesPage() {
  const { t } = useTranslation()

  const [rooms, setRooms] = useState<RoomFormData[]>([])
  const [venueMap, setVenueMap] = useState<Record<string, ApiVenue>>({})
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<RoomFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadVenues = useCallback(async () => {
    setLoading(true)
    try {
      const venues = await getPartnerVenues()
      const map: Record<string, ApiVenue> = {}
      venues.forEach(v => { map[v.id] = v })
      setVenueMap(map)
      setRooms(flattenVenues(venues))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load rooms"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadVenues() }, [loadVenues])

  const handleEdit = (room: RoomFormData) => {
    setEditingId(room.id ?? "new")
    setFormData({ ...room })
  }

  const handleAddNew = () => {
    setEditingId("new")
    setFormData({ ...EMPTY_FORM })
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.venueName.trim() || !formData.address.trim()) {
      toast.error("Room name, venue name, and address are required.")
      return
    }
    setSaving(true)
    try {
      const specs = {
        ...(formData.specs.size ? { size: formData.specs.size } : {}),
        ...(formData.specs.floor ? { floor: formData.specs.floor } : {}),
        ...(formData.specs.view ? { view: formData.specs.view } : {}),
      }

      if (formData.id === null) {
        // ── Create: venue first, then room ──
        const venue = await createVenue({
          name: formData.venueName,
          address: formData.address,
          district: formData.district,
        })
        const room = await createRoom(venue.id, {
          name: formData.name,
          description: formData.description,
          capacity: formData.capacity,
          pricePerHour: formData.pricePerHour,
          category: formData.category,
          amenities: formData.amenities,
          vibeTags: formData.vibeTags,
          specs,
        })
        const newRow: RoomFormData = {
          id: room.id,
          venueId: venue.id,
          name: room.name,
          venueName: venue.name,
          address: venue.address,
          district: venue.district,
          description: room.description,
          capacity: room.capacity,
          pricePerHour: room.pricePerHour,
          category: room.category,
          specs: formData.specs,
          amenities: room.amenities,
          vibeTags: room.vibeTags,
          status: room.status,
        }
        setRooms(prev => [newRow, ...prev])
        setVenueMap(prev => ({ ...prev, [venue.id]: { ...venue, rooms: [] } }))
        toast.success("Room created successfully.")
      } else {
        // ── Update: venue fields + room fields ──
        if (formData.venueId) {
          await updateVenue(formData.venueId, {
            name: formData.venueName,
            address: formData.address,
            district: formData.district,
          })
        }
        const updated = await updateRoom(formData.id, {
          name: formData.name,
          description: formData.description,
          capacity: formData.capacity,
          pricePerHour: formData.pricePerHour,
          category: formData.category,
          amenities: formData.amenities,
          vibeTags: formData.vibeTags,
          specs,
        })
        setRooms(prev =>
          prev.map(r =>
            r.id === formData.id
              ? {
                  ...formData,
                  amenities: updated.amenities,
                  vibeTags: updated.vibeTags,
                  status: updated.status,
                }
              : r
          )
        )
        toast.success("Room updated successfully.")
      }
      setEditingId(null)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save room"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (room: RoomFormData) => {
    if (!room.id) return
    if (!confirm(`Archive "${room.name}"? It will be hidden from listings.`)) return
    setDeleting(room.id)
    try {
      await deleteRoom(room.id)
      setRooms(prev => prev.filter(r => r.id !== room.id))
      toast.success("Room archived.")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to archive room"
      toast.error(msg)
    } finally {
      setDeleting(null)
    }
  }

  const toggleArrayItem = <T extends string>(field: keyof RoomFormData, item: T) => {
    setFormData(prev => {
      const arr = (prev[field] as T[])
      return {
        ...prev,
        [field]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item],
      }
    })
  }

  // ── Edit form ──────────────────────────────────────────────────────────────

  if (editingId !== null) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
          <button
            onClick={() => setEditingId(null)}
            className="flex items-center gap-2 font-semibold text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:-translate-x-0.5"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Venues
          </button>
          <div className="flex gap-2.5">
            <Button variant="outline" onClick={() => setEditingId(null)} className="rounded-xl px-5 font-semibold text-sm">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl px-6 font-semibold text-sm flex items-center gap-2 shadow-sm"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col gap-8">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight flex items-center gap-3 border-b border-border/50 pb-4 text-foreground">
            <Building2 className="h-6 w-6 text-primary" />
            {formData.id ? `Edit: ${formData.name}` : "Add New Room"}
          </h2>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left column */}
            <div className="flex flex-col gap-8">

              {/* Identity & Location */}
              <div className="rounded-xl border border-border/40 bg-muted/5 p-5 flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-border/30 pb-2.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm text-foreground tracking-tight">Identity & Location</h3>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" /> Venue / Building Name
                  </label>
                  <input
                    type="text"
                    value={formData.venueName}
                    onChange={e => setFormData({ ...formData, venueName: e.target.value })}
                    placeholder="e.g. The Coffee Lab"
                    className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-medium text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Exact Street Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. 123 Nguyen Hue, Ben Nghe Ward"
                    className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-medium text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">District</label>
                  <select
                    value={formData.district}
                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                    className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-semibold text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-all appearance-none cursor-pointer"
                  >
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Room Details */}
              <div className="rounded-xl border border-border/40 bg-muted/5 p-5 flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-border/30 pb-2.5">
                  <LayoutList className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm text-foreground tracking-tight">Room Details</h3>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Room Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Focus Pod A"
                    className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 font-semibold text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Room Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as "team_hub" | "solo_nook" })}
                    className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-semibold text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="solo_nook">Solo Nook / Focus Pod</option>
                    <option value="team_hub">Team Hub / Meeting Room</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-primary" /> Price/Hr (VND)
                    </label>
                    <input
                      type="number"
                      step="10000"
                      min="10000"
                      value={formData.pricePerHour}
                      onChange={e => setFormData({ ...formData, pricePerHour: Number(e.target.value) })}
                      className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-semibold text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary" /> Capacity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
                      className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-semibold text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-all"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <AlignLeft className="h-3.5 w-3.5 text-primary" /> Description
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the vibe and purpose of this room..."
                    className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-medium text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-8">

              {/* Physical Specs */}
              <div className="rounded-xl border border-border/40 bg-muted/5 p-5 flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-border/30 pb-2.5">
                  <Info className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm text-foreground tracking-tight">Physical Specs</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">Size (sqm)</label>
                    <input
                      type="text"
                      value={formData.specs.size}
                      onChange={e => setFormData({ ...formData, specs: { ...formData.specs, size: e.target.value } })}
                      placeholder="e.g. 15sqm"
                      className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-semibold text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">Floor Level</label>
                    <input
                      type="text"
                      value={formData.specs.floor}
                      onChange={e => setFormData({ ...formData, specs: { ...formData.specs, floor: e.target.value } })}
                      placeholder="e.g. 3rd Floor"
                      className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-semibold text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2 col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Navigation2 className="h-3.5 w-3.5 text-primary" /> View Feature
                    </label>
                    <input
                      type="text"
                      value={formData.specs.view}
                      onChange={e => setFormData({ ...formData, specs: { ...formData.specs, view: e.target.value } })}
                      placeholder="e.g. Skyline, Internal Garden"
                      className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-semibold text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold text-muted-foreground border-b border-border/40 pb-2">
                  Amenities Provided
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {AMENITY_OPTIONS.map(({ value, label }) => {
                    const checked = formData.amenities.includes(value)
                    return (
                      <label
                        key={value}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-all duration-200",
                          checked
                            ? "border-primary/30 bg-primary/5 text-primary"
                            : "border-border/60 hover:border-border bg-background/50 text-foreground/90"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleArrayItem("amenities", value)}
                          className="w-4 h-4 accent-primary rounded"
                        />
                        <span className="font-semibold text-xs">{label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Vibe Tags */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold text-muted-foreground border-b border-border/40 pb-2 flex items-center gap-1">
                  <Tags className="h-3.5 w-3.5 text-primary" /> Vibe Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {VIBE_TAG_OPTIONS.map(({ value, label }) => {
                    const checked = formData.vibeTags.includes(value)
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleArrayItem("vibeTags", value)}
                        className={cn(
                          "px-4 py-2 rounded-full border text-xs font-medium transition-all duration-200",
                          checked
                            ? "bg-primary/10 text-primary border-primary/30 font-semibold"
                            : "bg-background/60 text-muted-foreground border-border/60 hover:text-foreground"
                        )}
                      >
                        #{label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Gallery placeholder */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-semibold text-muted-foreground border-b border-border/40 pb-2">
                  Room Gallery
                </label>
                <div className="border-2 border-dashed border-border/60 rounded-xl flex flex-col items-center justify-center p-8 bg-muted/5 hover:bg-muted/10 transition-all cursor-pointer text-center min-h-[140px]">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <span className="font-semibold text-sm text-foreground/70">Upload Photos</span>
                  <span className="text-xs text-muted-foreground mt-1 font-medium">Coming soon — JPG/PNG, max 5MB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── List view ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3 text-foreground">
            <Building2 className="h-8 w-8 text-primary hidden md:block" /> Venues
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your rooms, capacity, amenities, and specifications.
          </p>
        </div>
        <Button onClick={handleAddNew} className="font-semibold rounded-xl flex items-center gap-2 px-6 shadow-sm">
          <Plus className="h-5 w-5" /> Add Room
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-border/50 overflow-hidden animate-pulse">
              <div className="aspect-[16/9] bg-muted/30" />
              <div className="p-5 flex flex-col gap-3">
                <div className="h-5 bg-muted/30 rounded-lg w-3/4" />
                <div className="h-4 bg-muted/20 rounded-lg w-1/2" />
                <div className="h-4 bg-muted/20 rounded-lg w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-16 text-center gap-4">
          <Building2 className="h-12 w-12 text-muted-foreground/30" />
          <div>
            <p className="text-base font-semibold text-foreground">No rooms yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first room to start accepting bookings.</p>
          </div>
          <Button onClick={handleAddNew} className="rounded-xl gap-2">
            <Plus className="h-4 w-4" /> Add Room
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map(room => (
            <div
              key={room.id}
              className="flex flex-col rounded-2xl border border-border/50 bg-card shadow-[0_4px_20px_-4px_rgba(41,35,30,0.04)] hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="aspect-[16/9] bg-muted/20 border-b border-border/40 relative flex items-center justify-center overflow-hidden rounded-t-2xl">
                <ImageIcon className="h-12 w-12 text-muted-foreground/30 absolute z-0" />
                <div className="absolute top-3 right-3 bg-foreground/90 text-background px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase">
                  {room.category.replace("_", " ")}
                </div>
                {room.status && room.status !== "published" && (
                  <div className={cn(
                    "absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                    room.status === "draft" ? "bg-yellow-500/20 text-yellow-700 border border-yellow-500/30" :
                    room.status === "unavailable" ? "bg-destructive/20 text-destructive border border-destructive/30" :
                    "bg-muted/50 text-muted-foreground border border-border/40"
                  )}>
                    {room.status}
                  </div>
                )}
              </div>

              <div className="p-4 md:p-6 flex flex-col flex-1 gap-2">
                <h3 className="font-semibold text-lg tracking-tight text-foreground line-clamp-1">{room.name}</h3>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mt-1 border-b border-border/40 pb-3 line-clamp-1">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" /> {room.venueName} · {room.district}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border border-border/60 text-xs font-semibold text-foreground">
                    <Users className="h-4 w-4 text-muted-foreground" /> {room.capacity} Pax
                  </span>
                  <span className="flex items-center gap-1.5 text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 text-xs font-semibold">
                    <DollarSign className="h-4 w-4" /> {formatVND(room.pricePerHour)}/hr
                  </span>
                </div>
              </div>

              <div className="p-4 border-t border-border/40 mt-auto bg-muted/10 rounded-b-2xl flex gap-2">
                <Button
                  onClick={() => handleEdit(room)}
                  variant="outline"
                  className="flex-1 font-semibold rounded-xl bg-transparent"
                >
                  <Edit2 className="h-4 w-4" /> Edit
                </Button>
                <Button
                  onClick={() => handleDelete(room)}
                  variant="outline"
                  disabled={deleting === room.id}
                  className="rounded-xl text-destructive hover:bg-destructive/10 hover:border-destructive/30 border-border/60 bg-transparent"
                >
                  {deleting === room.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Trash2 className="h-4 w-4" />
                  }
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

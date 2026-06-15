"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslation } from "@/lib/i18n/context"
import {
  Building2, Plus, Image as ImageIcon, Check, MapPin, Users, Edit2,
  ArrowLeft, Tags, AlignLeft, DollarSign, LayoutList, Navigation2,
  Info, Trash2, Loader2, Globe, Upload, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { formatVND } from "@/lib/format"
import {
  getPartnerVenues, createVenue, updateVenue, updateVenueStatus,
  createRoom, updateRoom, deleteRoom, updateRoomStatus,
  uploadRoomImage, saveRoomImages, deleteRoomImage,
  type ApiVenue,
} from "@/lib/api/partner"
import type { Amenity, VibeTag } from "@/lib/types"

// ─── Local form shape ─────────────────────────────────────────────────────────

interface RoomImage {
  id: string
  url: string
  sortOrder: number
}

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
  images: RoomImage[]
}

interface FormErrors {
  name?: string
  venueName?: string
  address?: string
  capacity?: string
  pricePerHour?: string
  description?: string
}

const AMENITY_VALUES: Amenity[] = ["wifi", "tv", "whiteboard", "ac", "hdmi", "projector", "power_outlets", "coffee", "water", "parking"]
const VIBE_VALUES: VibeTag[] = ["ultra_quiet", "discussion_friendly", "cold_ac", "natural_light", "cozy", "modern", "rooftop", "garden_view"]

const DISTRICTS = ["District 1", "District 2", "District 3", "District 4", "District 5",
  "District 6", "District 7", "District 8", "District 9", "District 10",
  "District 11", "District 12", "Binh Thanh", "Go Vap", "Phu Nhuan",
  "Tan Binh", "Tan Phu", "Thu Duc", "Binh Chanh", "Hoc Mon"]

function flattenVenues(venues: ApiVenue[]): RoomFormData[] {
  return venues.flatMap((v): RoomFormData[] => {
    if (v.rooms.length === 0) {
      return [{
        id: null,
        venueId: v.id,
        name: "",
        venueName: v.name,
        address: v.address,
        district: v.district,
        description: "",
        capacity: 4,
        pricePerHour: 120000,
        category: "team_hub" as const,
        specs: { size: "", floor: "", view: "" },
        amenities: [],
        vibeTags: [],
        status: "empty",
        images: [],
      }]
    }
    return v.rooms.map(r => ({
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
      images: (r.images ?? []).map(img => ({ id: img.id, url: img.imageUrl, sortOrder: img.sortOrder })),
    }))
  })
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
  images: [],
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VenuesPage() {
  const { t } = useTranslation()

  const AMENITY_KEY: Record<string, string> = {
    wifi: "partner.amenityWifi", tv: "partner.amenityTv", whiteboard: "partner.amenityWhiteboard",
    ac: "partner.amenityAc", hdmi: "partner.amenityHdmi", projector: "partner.amenityProjector",
    power_outlets: "partner.amenityPowerOutlets", coffee: "partner.amenityCoffee",
    water: "partner.amenityWater", parking: "partner.amenityParking",
  }
  const VIBE_KEY: Record<string, string> = {
    ultra_quiet: "partner.vibeUltraQuiet", discussion_friendly: "partner.vibeDiscussionFriendly",
    cold_ac: "partner.vibeColdAc", natural_light: "partner.vibeNaturalLight",
    cozy: "partner.vibeCozy", modern: "partner.vibeModern",
    rooftop: "partner.vibeRooftop", garden_view: "partner.vibeGardenView",
  }
  const AMENITY_OPTIONS = AMENITY_VALUES.map(v => ({ value: v, label: t(AMENITY_KEY[v]) }))
  const VIBE_TAG_OPTIONS = VIBE_VALUES.map(v => ({ value: v, label: t(VIBE_KEY[v]) }))

  const [rooms, setRooms] = useState<RoomFormData[]>([])
  const [venueMap, setVenueMap] = useState<Record<string, ApiVenue>>({})
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<RoomFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})

  // Image upload state (not in formData — files can't be serialised)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([])
  const [toDeleteIds, setToDeleteIds] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Derived: whether to show new-venue creation fields ────────────────────
  // True when creating a new room AND no existing venue is selected
  const isCreatingNewVenue = formData.id === null && formData.venueId === null
  const hasExistingVenues = Object.keys(venueMap).length > 0

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = t("partner.validRoomNameRequired")
    } else if (formData.name.trim().length < 3) {
      newErrors.name = t("partner.validRoomNameMin")
    } else if (formData.name.trim().length > 50) {
      newErrors.name = t("partner.validRoomNameMax")
    }

    // Validate venue fields only when creating a new venue OR editing an existing room
    const needsVenueValidation = formData.id !== null || isCreatingNewVenue
    if (needsVenueValidation) {
      if (!formData.venueName.trim()) {
        newErrors.venueName = t("partner.validVenueNameRequired")
      } else if (formData.venueName.trim().length < 3) {
        newErrors.venueName = t("partner.validVenueNameMin")
      } else if (formData.venueName.trim().length > 100) {
        newErrors.venueName = t("partner.validVenueNameMax")
      }

      if (!formData.address.trim()) {
        newErrors.address = t("partner.validAddressRequired")
      } else if (formData.address.trim().length < 5) {
        newErrors.address = t("partner.validAddressMin")
      }
    }

    if (formData.capacity < 1) {
      newErrors.capacity = t("partner.validCapacityMin")
    } else if (formData.capacity > 100) {
      newErrors.capacity = t("partner.validCapacityMax")
    } else if (!Number.isInteger(formData.capacity)) {
      newErrors.capacity = t("partner.validCapacityWhole")
    }

    if (formData.pricePerHour < 10000) {
      newErrors.pricePerHour = t("partner.validPriceMin")
    } else if (formData.pricePerHour > 50000000) {
      newErrors.pricePerHour = t("partner.validPriceMax")
    }

    if (formData.description.trim().length > 500) {
      newErrors.description = t("partner.validDescMax")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

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

  const resetImageState = () => {
    pendingPreviews.forEach(url => URL.revokeObjectURL(url))
    setPendingFiles([])
    setPendingPreviews([])
    setToDeleteIds([])
  }

  const handleEdit = (room: RoomFormData) => {
    setEditingId(room.id ?? "new")
    setFormData({ ...room })
    resetImageState()
    setErrors({})
  }

  const handleAddNew = () => {
    setEditingId("new")
    // Pre-select the first existing venue so the user doesn't re-type venue info
    const firstVenueId = Object.keys(venueMap)[0]
    if (firstVenueId) {
      const v = venueMap[firstVenueId]
      setFormData({ ...EMPTY_FORM, venueId: v.id, venueName: v.name, address: v.address, district: v.district })
    } else {
      setFormData({ ...EMPTY_FORM })
    }
    resetImageState()
    setErrors({})
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    resetImageState()
    setErrors({})
  }

  const handleVenueSelect = (value: string) => {
    if (value === "new") {
      setFormData(prev => ({ ...prev, venueId: null, venueName: "", address: "", district: "District 1" }))
    } else {
      const v = venueMap[value]
      setFormData(prev => ({ ...prev, venueId: v.id, venueName: v.name, address: v.address, district: v.district }))
    }
    setErrors(prev => ({ ...prev, venueName: undefined, address: undefined }))
  }

  // ── Image handlers ────────────────────────────────────────────────────────

  const currentImageCount =
    formData.images.filter(img => !toDeleteIds.includes(img.id)).length + pendingFiles.length

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const MAX_SIZE = 5 * 1024 * 1024 // 5 MB — matches Supabase bucket limit
    const files = Array.from(e.target.files ?? [])

    const oversized = files.filter(f => f.size > MAX_SIZE)
    if (oversized.length > 0) {
      toast.error(`${oversized.map(f => f.name).join(", ")} ${oversized.length === 1 ? "exceeds" : "exceed"} the 5 MB limit.`)
    }
    const sizedOk = files.filter(f => f.size <= MAX_SIZE)

    const remaining = 5 - currentImageCount
    const toAdd = sizedOk.slice(0, remaining)
    if (sizedOk.length > remaining) {
      toast.error(`Maximum 5 photos per room — only ${remaining} slot${remaining === 1 ? "" : "s"} left.`)
    }
    const newPreviews = toAdd.map(f => URL.createObjectURL(f))
    setPendingFiles(prev => [...prev, ...toAdd])
    setPendingPreviews(prev => [...prev, ...newPreviews])
    e.target.value = ""
  }

  const removePendingFile = (index: number) => {
    URL.revokeObjectURL(pendingPreviews[index])
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
    setPendingPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const markImageForDeletion = (imageId: string) => {
    setToDeleteIds(prev => [...prev, imageId])
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error(t("partner.fixErrorsAbove"))
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
        // ── Create room ────────────────────────────────────────────────────
        let targetVenueId: string

        if (formData.venueId) {
          // Add to existing venue — no venue API call needed
          targetVenueId = formData.venueId
        } else {
          // Brand new venue + room
          const venue = await createVenue({
            name: formData.venueName,
            address: formData.address,
            district: formData.district,
          })
          targetVenueId = venue.id
          setVenueMap(prev => ({ ...prev, [venue.id]: { ...venue, rooms: [] } }))
        }

        const room = await createRoom(targetVenueId, {
          name: formData.name,
          description: formData.description,
          capacity: formData.capacity,
          pricePerHour: formData.pricePerHour,
          category: formData.category,
          amenities: formData.amenities,
          vibeTags: formData.vibeTags,
          specs,
        })

        // Upload and save images
        if (pendingFiles.length > 0) {
          const uploadedUrls: string[] = []
          for (const file of pendingFiles) {
            const url = await uploadRoomImage(file, room.id)
            uploadedUrls.push(url)
          }
          await saveRoomImages(room.id, uploadedUrls)
        }

        resetImageState()
        await loadVenues()
        toast.success(t("partner.roomCreatedSuccess"))
      } else {
        // ── Update room ────────────────────────────────────────────────────
        if (formData.venueId) {
          await updateVenue(formData.venueId, {
            name: formData.venueName,
            address: formData.address,
            district: formData.district,
          })
        }
        await updateRoom(formData.id, {
          name: formData.name,
          description: formData.description,
          capacity: formData.capacity,
          pricePerHour: formData.pricePerHour,
          category: formData.category,
          amenities: formData.amenities,
          vibeTags: formData.vibeTags,
          specs,
        })

        // Delete removed images
        for (const imageId of toDeleteIds) {
          await deleteRoomImage(formData.id, imageId)
        }

        // Upload and save new images
        if (pendingFiles.length > 0) {
          const uploadedUrls: string[] = []
          for (const file of pendingFiles) {
            const url = await uploadRoomImage(file, formData.id)
            uploadedUrls.push(url)
          }
          await saveRoomImages(formData.id, uploadedUrls)
        }

        resetImageState()
        await loadVenues()
        toast.success(t("partner.roomUpdatedSuccess"))
      }

      setEditingId(null)
      setErrors({})
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save room"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handlePublishRoom = async (room: RoomFormData) => {
    if (!room.id) return
    setPublishing(room.id)
    try {
      await updateRoomStatus(room.id, "published")
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, status: "published" } : r))
      toast.success(`"${room.name}" ${t("partner.roomPublishedLive")}.`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to publish room"
      toast.error(msg)
    } finally {
      setPublishing(null)
    }
  }

  const handlePublishVenue = async (venueId: string) => {
    setPublishing(venueId)
    try {
      const updated = await updateVenueStatus(venueId, "published")
      setVenueMap(prev => ({ ...prev, [venueId]: { ...prev[venueId], status: updated.status } }))
      toast.success(t("partner.venuePublishedSuccess"))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to publish venue"
      toast.error(msg)
    } finally {
      setPublishing(null)
    }
  }

  const handleDelete = async (room: RoomFormData) => {
    if (!room.id) return
    if (!confirm(`${t("partner.archiveConfirmTitle")} "${room.name}"? ${t("partner.archiveConfirmBody")}`)) return
    setDeleting(room.id)
    try {
      await deleteRoom(room.id)
      setRooms(prev => prev.filter(r => r.id !== room.id))
      toast.success(t("partner.roomArchivedSuccess"))
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
    const isNewRoom = formData.id === null
    const visibleImages = formData.images.filter(img => !toDeleteIds.includes(img.id))

    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 font-semibold text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:-translate-x-0.5"
          >
            <ArrowLeft className="h-4 w-4" /> {t("partner.backToVenues")}
          </button>
          <div className="flex gap-2.5">
            <Button variant="outline" onClick={handleCancel} className="rounded-xl px-5 font-semibold text-sm">
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl px-6 font-semibold text-sm flex items-center gap-2 shadow-sm"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? t("partner.saving") : t("partner.saveChanges")}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col gap-8">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight flex items-center gap-3 border-b border-border/50 pb-4 text-foreground">
            <Building2 className="h-6 w-6 text-primary" />
            {formData.id ? `${t("partner.editLabel")}: ${formData.name}` : t("partner.addNewRoom")}
          </h2>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left column */}
            <div className="flex flex-col gap-8">

              {/* Identity & Location */}
              <div className="rounded-xl border border-border/40 bg-muted/5 p-5 flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-border/30 pb-2.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm text-foreground tracking-tight">{t("partner.identityLocation")}</h3>
                </div>

                {/* ── Venue selector (new rooms only) ── */}
                {isNewRoom && hasExistingVenues && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-primary" /> {t("partner.venueLabel")}
                    </label>
                    <select
                      value={formData.venueId ?? "new"}
                      onChange={e => handleVenueSelect(e.target.value)}
                      className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-semibold text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-all appearance-none cursor-pointer"
                    >
                      {Object.values(venueMap).map(v => (
                        <option key={v.id} value={v.id}>{v.name} — {v.district}</option>
                      ))}
                      <option value="new">{t("partner.createNewVenueOption")}</option>
                    </select>
                    {/* Show locked address when existing venue is selected */}
                    {formData.venueId && (
                      <div className="rounded-xl border border-border/30 bg-muted/10 px-3.5 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                        <span>{venueMap[formData.venueId]?.address} · {venueMap[formData.venueId]?.district}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Venue creation fields (new venue OR editing) ── */}
                {(!isNewRoom || isCreatingNewVenue || !hasExistingVenues) && (
                  <>
                    {isCreatingNewVenue && hasExistingVenues && (
                      <p className="text-xs text-muted-foreground bg-muted/20 rounded-lg px-3 py-2 border border-border/30">
                        {t("partner.newVenueDetailsHint")}
                      </p>
                    )}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-primary" /> {t("partner.venueBuildingName")}
                      </label>
                      <input
                        type="text"
                        value={formData.venueName}
                        onChange={e => setFormData({ ...formData, venueName: e.target.value })}
                        placeholder="e.g. The Coffee Lab"
                        className={cn(
                          "rounded-xl border bg-background/50 px-3.5 py-2.5 font-medium text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 transition-all",
                          errors.venueName ? "border-destructive focus-visible:ring-destructive/30" : "border-border/60 focus-visible:ring-ring/50"
                        )}
                      />
                      {errors.venueName && <span className="text-xs font-medium text-destructive">{errors.venueName}</span>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-muted-foreground">{t("partner.exactStreetAddress")}</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        placeholder="e.g. 123 Nguyen Hue, Ben Nghe Ward"
                        className={cn(
                          "rounded-xl border bg-background/50 px-3.5 py-2.5 font-medium text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 transition-all",
                          errors.address ? "border-destructive focus-visible:ring-destructive/30" : "border-border/60 focus-visible:ring-ring/50"
                        )}
                      />
                      {errors.address && <span className="text-xs font-medium text-destructive">{errors.address}</span>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-muted-foreground">{t("partner.districtLabel")}</label>
                      <select
                        value={formData.district}
                        onChange={e => setFormData({ ...formData, district: e.target.value })}
                        className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-semibold text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-all appearance-none cursor-pointer"
                      >
                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Room Details */}
              <div className="rounded-xl border border-border/40 bg-muted/5 p-5 flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-border/30 pb-2.5">
                  <LayoutList className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm text-foreground tracking-tight">{t("partner.roomDetailsSection")}</h3>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">{t("partner.roomNameLabel")}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Focus Pod A"
                    className={cn(
                      "rounded-xl border bg-primary/5 px-4 py-3 font-semibold text-base text-foreground focus-visible:outline-none focus-visible:ring-2 transition-all",
                      errors.name ? "border-destructive focus-visible:ring-destructive/30" : "border-primary/30 focus-visible:ring-primary/40"
                    )}
                  />
                  {errors.name && <span className="text-xs font-medium text-destructive">{errors.name}</span>}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">{t("partner.roomCategoryLabel")}</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as "team_hub" | "solo_nook" })}
                    className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-semibold text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="solo_nook">{t("partner.categorySoloNook")}</option>
                    <option value="team_hub">{t("partner.categoryTeamHub")}</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-primary" /> {t("partner.pricePerHrLabel")}
                    </label>
                    <input
                      type="number"
                      step="10000"
                      min="10000"
                      value={formData.pricePerHour}
                      onChange={e => setFormData({ ...formData, pricePerHour: Number(e.target.value) })}
                      className={cn(
                        "rounded-xl border bg-background/50 px-3.5 py-2.5 font-semibold text-sm text-primary focus-visible:outline-none focus-visible:ring-2 transition-all",
                        errors.pricePerHour ? "border-destructive focus-visible:ring-destructive/30" : "border-border/60 focus-visible:ring-ring/50"
                      )}
                    />
                    {errors.pricePerHour && <span className="text-xs font-medium text-destructive">{errors.pricePerHour}</span>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-primary" /> {t("partner.capacityLabel")}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
                      className={cn(
                        "rounded-xl border bg-background/50 px-3.5 py-2.5 font-semibold text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 transition-all",
                        errors.capacity ? "border-destructive focus-visible:ring-destructive/30" : "border-border/60 focus-visible:ring-ring/50"
                      )}
                    />
                    {errors.capacity && <span className="text-xs font-medium text-destructive">{errors.capacity}</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <AlignLeft className="h-3.5 w-3.5 text-primary" /> {t("partner.descriptionLabel")}
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t("partner.descriptionPlaceholder")}
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
                  <h3 className="font-semibold text-sm text-foreground tracking-tight">{t("partner.physicalSpecs")}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">{t("partner.sizeLabel")}</label>
                    <input
                      type="text"
                      value={formData.specs.size}
                      onChange={e => setFormData({ ...formData, specs: { ...formData.specs, size: e.target.value } })}
                      placeholder="e.g. 15sqm"
                      className="rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5 font-semibold text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-muted-foreground">{t("partner.floorLevel")}</label>
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
                      <Navigation2 className="h-3.5 w-3.5 text-primary" /> {t("partner.viewFeature")}
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
                <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {t("partner.amenitiesProvided")}
                  </label>
                  <span className="text-[10px] font-medium text-muted-foreground/70">
                    {formData.amenities.length} {t("partner.selectedCountLabel")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {AMENITY_OPTIONS.map(({ value, label }) => {
                    const checked = formData.amenities.includes(value)
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleArrayItem("amenities", value)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-all duration-200 text-left group",
                          checked
                            ? "border-primary/40 bg-primary/8 text-primary shadow-sm"
                            : "border-border/60 hover:border-primary/30 bg-background/50 text-foreground/90 hover:bg-muted/30"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border transition-all flex items-center justify-center shrink-0",
                          checked
                            ? "bg-primary border-primary"
                            : "border-border/60 group-hover:border-primary/40"
                        )}>
                          {checked && <Check className="h-3 w-3 text-background" />}
                        </div>
                        <span className="font-semibold text-xs">{label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Vibe Tags */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Tags className="h-3.5 w-3.5 text-primary" /> {t("partner.vibeTagsLabel")}
                  </label>
                  <span className="text-[10px] font-medium text-muted-foreground/70">
                    {formData.vibeTags.length} {t("partner.selectedCountLabel")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {VIBE_TAG_OPTIONS.map(({ value, label }) => {
                    const checked = formData.vibeTags.includes(value)
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleArrayItem("vibeTags", value)}
                        className={cn(
                          "px-3.5 py-2 rounded-full border text-xs font-medium transition-all duration-200 hover:shadow-sm",
                          checked
                            ? "bg-primary/10 text-primary border-primary/30 font-semibold shadow-sm"
                            : "bg-background/60 text-muted-foreground border-border/60 hover:text-foreground hover:border-primary/20"
                        )}
                      >
                        #{label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Gallery */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <label className="text-xs font-semibold text-muted-foreground">{t("partner.roomGallery")}</label>
                  <span className="text-[10px] font-medium text-muted-foreground/70">
                    {currentImageCount} / 5 {t("partner.photosCountLabel")}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Saved images (minus ones marked for deletion) */}
                  {visibleImages.map(img => (
                    <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => markImageForDeletion(img.id)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  ))}

                  {/* Pending (not-yet-uploaded) previews */}
                  {pendingPreviews.map((preview, i) => (
                    <div key={`pending-${i}`} className="relative aspect-square rounded-xl overflow-hidden group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-1.5 right-1.5 bg-primary/90 text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {t("partner.newBadge")}
                      </div>
                      <button
                        type="button"
                        onClick={() => removePendingFile(i)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  ))}

                  {/* Upload slot */}
                  {currentImageCount < 5 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-primary/40 hover:bg-muted/10 transition-all">
                      <Upload className="h-5 w-5 text-muted-foreground/50" />
                      <span className="text-[10px] font-medium text-muted-foreground/70">{t("partner.addPhotoLabel")}</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </label>
                  )}
                </div>

                <p className="text-[10px] text-muted-foreground/60">
                  {t("partner.photoRequirements")}
                </p>
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
            <Building2 className="h-8 w-8 text-primary hidden md:block" /> {t("partner.venuesTitle")}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {t("partner.venuesSubtitle")}
          </p>
        </div>
        <Button onClick={handleAddNew} className="font-semibold rounded-xl flex items-center gap-2 px-6 shadow-sm">
          <Plus className="h-5 w-5" /> {t("partner.addRoom")}
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
            <p className="text-base font-semibold text-foreground">{t("partner.noRoomsYet")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("partner.noRoomsYetDesc")}</p>
          </div>
          <Button onClick={handleAddNew} className="rounded-xl gap-2">
            <Plus className="h-4 w-4" /> {t("partner.addRoom")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room, idx) => {
            const isEmpty = room.status === "empty"
            const firstImage = room.images?.[0]
            return (
              <div
                key={room.id ?? `empty-${idx}`}
                className={cn(
                  "flex flex-col rounded-2xl border bg-card shadow-[0_4px_20px_-4px_rgba(41,35,30,0.04)] hover:-translate-y-0.5 transition-all duration-300 group",
                  isEmpty ? "border-dashed border-border/60" : "border-border/50"
                )}
              >
                {isEmpty ? (
                  <div className="aspect-[16/9] bg-muted/10 border-b border-dashed border-border/40 relative flex flex-col items-center justify-center overflow-hidden rounded-t-2xl gap-2">
                    <Plus className="h-10 w-10 text-muted-foreground/30" />
                    <span className="text-xs font-medium text-muted-foreground/60">{t("partner.noRoomsYet")}</span>
                  </div>
                ) : (
                  <div className="aspect-[16/9] bg-muted/20 border-b border-border/40 relative flex items-center justify-center overflow-hidden rounded-t-2xl">
                    {firstImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={firstImage.url}
                        alt={room.name}
                        className="w-full h-full object-cover absolute inset-0"
                      />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-muted-foreground/30 absolute z-0" />
                    )}
                    <div className="absolute top-3 right-3 bg-foreground/90 text-background px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase z-10">
                      {room.category.replace("_", " ")}
                    </div>
                    {room.status && (
                      <div className={cn(
                        "absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider z-10",
                        room.status === "published" ? "bg-emerald-500/20 text-emerald-700 border border-emerald-500/30" :
                        room.status === "draft" ? "bg-yellow-500/20 text-yellow-700 border border-yellow-500/30" :
                        room.status === "unavailable" ? "bg-destructive/20 text-destructive border border-destructive/30" :
                        "bg-muted/50 text-muted-foreground border border-border/40"
                      )}>
                        {room.status}
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 md:p-6 flex flex-col flex-1 gap-2">
                  {isEmpty ? (
                    <>
                      <h3 className="font-semibold text-lg tracking-tight text-foreground line-clamp-1">{room.venueName}</h3>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mt-1 border-b border-border/40 pb-3 line-clamp-1">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" /> {room.district}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">{t("partner.addRoomToVenueHint")}</p>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>

                <div className="p-4 border-t border-border/40 mt-auto bg-muted/10 rounded-b-2xl flex flex-col gap-2">
                  {isEmpty ? (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setEditingId("new")
                          setFormData({ ...EMPTY_FORM, venueId: room.venueId, venueName: room.venueName, address: room.address, district: room.district })
                          resetImageState()
                          setErrors({})
                        }}
                        className="flex-1 font-semibold rounded-xl flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" /> {t("partner.addFirstRoom")}
                      </Button>
                      {venueMap[room.venueId ?? ""]?.status !== "published" && (
                        <Button
                          onClick={() => handlePublishVenue(room.venueId!)}
                          disabled={publishing === room.venueId}
                          variant="outline"
                          className="rounded-xl font-semibold text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/10 bg-transparent"
                        >
                          {publishing === room.venueId
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Globe className="h-4 w-4" />
                          }
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      {(room.status === "draft" || room.status === "unavailable") && (
                        <Button
                          onClick={() => handlePublishRoom(room)}
                          disabled={publishing === room.id}
                          className="w-full font-semibold rounded-xl flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {publishing === room.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Globe className="h-4 w-4" />
                          }
                          {publishing === room.id ? t("partner.publishing") : t("partner.publishRoom")}
                        </Button>
                      )}
                      {venueMap[room.venueId ?? ""]?.status !== "published" && (
                        <Button
                          onClick={() => handlePublishVenue(room.venueId!)}
                          disabled={publishing === room.venueId}
                          variant="outline"
                          className="w-full rounded-xl font-semibold text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/10 bg-transparent"
                        >
                          {publishing === room.venueId
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Globe className="h-4 w-4" />
                          }
                          {publishing === room.venueId ? t("partner.publishing") : t("partner.publishVenue")}
                        </Button>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(room)}
                          variant="outline"
                          className="flex-1 font-semibold rounded-xl bg-transparent"
                        >
                          <Edit2 className="h-4 w-4" /> {t("partner.editLabel")}
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
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

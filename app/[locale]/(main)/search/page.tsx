"use client"

import { useState, useMemo, useCallback, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslation } from "@/lib/i18n/context"
import { getPublicRooms } from "@/lib/api/public-rooms"
import { selectCustomerRooms } from "@/lib/booking/check-in"
import { RoomCard } from "@/components/room-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SlidersHorizontal, List, Map, Search, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import dynamic from "next/dynamic"
import { formatVND } from "@/lib/format"
import type { Amenity, VibeTag, Room } from "@/lib/types"

// Leaflet touches `window` at import time, so it can't be server-rendered.
// Load the map only on the client.
const RoomMap = dynamic(() => import("@/components/room-map").then(m => m.RoomMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted/20 text-sm text-muted-foreground">
      …
    </div>
  ),
})

const districts = ["Thu Duc", "District 1", "District 7", "District 10", "Binh Thanh"]
const amenityOptions: Amenity[] = ["wifi", "tv", "whiteboard", "ac", "hdmi", "projector", "power_outlets", "coffee", "water", "parking"]
const vibeTagOptions: VibeTag[] = ["ultra_quiet", "discussion_friendly", "cold_ac", "natural_light", "cozy", "modern", "rooftop", "garden_view"]
const categoryOptions = ["team_hub", "solo_nook"] as const
const PAGE_SIZE = 6

function SearchContent() {
  const { locale, t } = useTranslation()
  const searchParams = useSearchParams()

  const initialQuery = searchParams.get("q") || ""
  const initialDistrict = searchParams.get("district") || ""
  const initialCapacity = searchParams.get("capacity") || ""
  const initialMaxPrice = searchParams.get("maxPrice") || ""
  const initialAmenities = searchParams.get("amenities")?.split(",").filter(Boolean) || []
  const initialVibes = searchParams.get("vibes")?.split(",").filter(Boolean) || []

  const [query, setQuery] = useState(initialQuery)
  const [district, setDistrict] = useState(initialDistrict)
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice ? [parseInt(initialMaxPrice)] : [300000])
  const [minCapacity, setMinCapacity] = useState(initialCapacity ? parseInt(initialCapacity) : 0)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialAmenities)
  const [selectedVibes, setSelectedVibes] = useState<string[]>(initialVibes)
  const [category, setCategory] = useState("")
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [noiseLevelMin, setNoiseLevelMin] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState("rating")
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])

  useEffect(() => {
    getPublicRooms()
      .then((publicRooms) => {
        setAvailableRooms(publicRooms)
      })
      .catch((error) => console.warn("Could not load published partner rooms:", error))
  }, [])

  const toggleAmenity = useCallback((amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    )
    setPage(1)
  }, [])

  const toggleVibe = useCallback((vibe: string) => {
    setSelectedVibes(prev =>
      prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe]
    )
    setPage(1)
  }, [])

  const { results, total, totalPages } = useMemo(() => {
    let filtered = availableRooms.filter(room => {
      // District filter
      if (district && district !== "all") {
        const filterDistrictLower = district.toLowerCase()
        const roomDistrictLower = room.district.toLowerCase()
        const matchesDistrict = (filterDistrictLower === "thu duc" && (roomDistrictLower === "thu duc" || roomDistrictLower.includes("thủ đức"))) ||
          (filterDistrictLower === "district 1" && (roomDistrictLower === "district 1" || roomDistrictLower.includes("quận 1"))) ||
          (filterDistrictLower === "district 7" && (roomDistrictLower === "district 7" || roomDistrictLower.includes("quận 7"))) ||
          (filterDistrictLower === "district 10" && (roomDistrictLower === "district 10" || roomDistrictLower.includes("quận 10"))) ||
          (filterDistrictLower === "binh thanh" && (roomDistrictLower === "binh thanh" || roomDistrictLower.includes("bình thạnh"))) ||
          (roomDistrictLower === filterDistrictLower)

        if (!matchesDistrict) return false
      }

      // Capacity filter
      if (minCapacity && room.capacity < minCapacity) return false

      // Price filter
      if (maxPrice[0] && room.pricePerHour > maxPrice[0]) return false

      // Amenities filter
      if (selectedAmenities.length > 0) {
        const hasAllAmenities = selectedAmenities.every(amenity => room.amenities.includes(amenity as Amenity))
        if (!hasAllAmenities) return false
      }

      // Vibe Tags filter
      if (selectedVibes.length > 0) {
        const hasSomeVibes = selectedVibes.some(vibe => room.vibeTags.includes(vibe as VibeTag))
        if (!hasSomeVibes) return false
      }

      // Category filter
      if (category && room.category !== category) return false

      // Verified filter
      if (verifiedOnly && !room.verified) return false

      // Noise Level filter
      if (noiseLevelMin && (room.noiseLevel ?? 0) < noiseLevelMin) return false

      // Query filter
      if (query) {
        const q = query.toLowerCase()
        const matchesQuery = room.name.toLowerCase().includes(q) ||
          room.venueName.toLowerCase().includes(q) ||
          room.district.toLowerCase().includes(q) ||
          room.description.toLowerCase().includes(q)

        if (!matchesQuery) return false
      }

      return true
    })

    // Sort
    switch (sortBy) {
      case "price_asc":
        filtered.sort((a, b) => a.pricePerHour - b.pricePerHour)
        break
      case "price_desc":
        filtered.sort((a, b) => b.pricePerHour - a.pricePerHour)
        break
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating)
        break
    }

    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const start = (page - 1) * PAGE_SIZE
    const paginated = filtered.slice(start, start + PAGE_SIZE)

    return { results: paginated, total, totalPages }
  }, [availableRooms, district, minCapacity, maxPrice, selectedAmenities, selectedVibes, category, verifiedOnly, noiseLevelMin, query, sortBy, page])

  const clearFilters = () => {
    setQuery("")
    setDistrict("")
    setMaxPrice([300000])
    setMinCapacity(0)
    setSelectedAmenities([])
    setSelectedVibes([])
    setCategory("")
    setVerifiedOnly(false)
    setNoiseLevelMin(0)
    setSelectedDate(undefined)
    setPage(1)
  }

  const hasActiveFilters = district || selectedAmenities.length > 0 || selectedVibes.length > 0 || minCapacity > 0 || category || verifiedOnly || noiseLevelMin > 0 || selectedDate

  const renderFilterPanel = () => (
    <div className="flex flex-col gap-6">
      <div>
        <Label className="mb-2 text-sm font-semibold">{t("landing.district")}</Label>
        <Select value={district} onValueChange={(v) => { setDistrict(v); setPage(1) }}>
          <SelectTrigger>
            <SelectValue placeholder={t("landing.allDistricts")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("landing.allDistricts")}</SelectItem>
            {districts.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 text-sm font-semibold">{t("search.priceRange")}</Label>
        <Slider
          value={maxPrice}
          onValueChange={(v) => { setMaxPrice(v); setPage(1) }}
          max={500000}
          min={50000}
          step={10000}
          className="mt-3"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{locale === "vi" ? "50.000 ₫" : "50,000 ₫"}</span>
          <span className="font-medium text-foreground">{formatVND(maxPrice[0])}</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-semibold">{t("search.capacityMin")}</Label>
          <span className="text-xs font-bold text-primary">
            {minCapacity === 0 ? (locale === "vi" ? "Bất kỳ" : "Any") : `${minCapacity}+ ${t("common.people")}`}
          </span>
        </div>
        <div className="px-1">
          <Slider
            value={[minCapacity === 0 ? 2 : minCapacity]}
            onValueChange={(val) => { setMinCapacity(val[0]); setPage(1) }}
            min={2}
            max={12}
            step={2}
            className="mt-2"
          />
          <div className="mt-2 flex justify-between px-0.5">
            {[2, 4, 6, 8, 10, 12].map((num) => {
              const isActive = minCapacity > 0 && num <= minCapacity;
              const isSelected = minCapacity === num || (minCapacity === 0 && num === 2);
              return (
                <div
                  key={num}
                  className="flex flex-col items-center gap-1 cursor-pointer"
                  onClick={() => { setMinCapacity(num); setPage(1) }}
                >
                  <div className={`h-2.5 w-2.5 rounded-full transition-all duration-200 border ${
                    isSelected
                      ? "bg-primary border-primary scale-125"
                      : isActive
                        ? "bg-primary/60 border-primary/40"
                        : "bg-muted border-muted-foreground/20"
                  }`} />
                  <span className={`text-[10px] transition-colors duration-200 font-semibold ${
                    isSelected
                      ? "text-primary font-bold"
                      : "text-muted-foreground/75"
                  }`}>
                    {num}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <Label className="mb-2 text-sm font-semibold">{t("search.amenities")}</Label>
        <div className="flex flex-col gap-2">
          {amenityOptions.map((amenity) => (
            <label key={amenity} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedAmenities.includes(amenity)}
                onCheckedChange={() => toggleAmenity(amenity)}
              />
              {t(`amenities.${amenity}`)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 text-sm font-semibold">{t("search.vibeTags")}</Label>
        <div className="flex flex-col gap-2">
          {vibeTagOptions.map((vibe) => (
            <label key={vibe} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedVibes.includes(vibe)}
                onCheckedChange={() => toggleVibe(vibe)}
              />
              {t(`vibes.${vibe}`)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 text-sm font-semibold">{t("search.category")}</Label>
        <Select value={category} onValueChange={(v) => { setCategory(v === "all" ? "" : v); setPage(1) }}>
          <SelectTrigger>
            <SelectValue placeholder={t("search.categoryAll")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("search.categoryAll")}</SelectItem>
            {categoryOptions.map((c) => (
              <SelectItem key={c} value={c}>{t(`search.${c === "team_hub" ? "teamHub" : "soloNook"}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">{t("search.verifiedOnly")}</Label>
        <Switch
          checked={verifiedOnly}
          onCheckedChange={(v) => { setVerifiedOnly(v); setPage(1) }}
        />
      </div>

      <div>
        <Label className="mb-2 text-sm font-semibold">{t("search.noiseLevel")}</Label>
        <Slider
          value={[noiseLevelMin === 0 ? 2 : noiseLevelMin]}
          onValueChange={(val) => { setNoiseLevelMin(val[0]); setPage(1) }}
          min={2}
          max={10}
          step={1}
          className="mt-3"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{t("search.anyNoise")}</span>
          <span className="font-medium text-foreground">
            {noiseLevelMin === 0
              ? t("search.anyNoise")
              : noiseLevelMin >= 8
                ? t("search.veryQuiet")
                : noiseLevelMin >= 5
                  ? t("search.quiet")
                  : t("search.moderate")}
          </span>
        </div>
      </div>

      <div>
        <Label className="mb-2 text-sm font-semibold">{t("search.date")}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? selectedDate.toLocaleDateString() : t("search.anyDate")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => { setSelectedDate(d); setPage(1) }}
              disabled={{ before: new Date() }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button variant="outline" onClick={clearFilters} className="w-full">
        {t("search.clearFilters")}
      </Button>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Search Bar + Controls */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("landing.searchPlaceholder")}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                {t("search.filters")}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t("search.filters")}</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                {renderFilterPanel()}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{total}</span> {t("search.resultsCount")}
          </p>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">{t("search.rating")}</SelectItem>
                <SelectItem value="price_asc">{t("search.priceLowHigh")}</SelectItem>
                <SelectItem value="price_desc">{t("search.priceHighLow")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="hidden items-center gap-1 rounded-lg border border-border p-1 md:flex">
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "map" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
              >
                <Map className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {district && (
              <Badge variant="secondary" className="gap-1">
                {district}
                <button onClick={() => { setDistrict(""); setPage(1) }} className="ml-1 text-xs">&times;</button>
              </Badge>
            )}
            {selectedAmenities.map(a => (
              <Badge key={a} variant="secondary" className="gap-1">
                {t(`amenities.${a}`)}
                <button onClick={() => toggleAmenity(a)} className="ml-1 text-xs">&times;</button>
              </Badge>
            ))}
            {selectedVibes.map(v => (
              <Badge key={v} variant="secondary" className="gap-1">
                {t(`vibes.${v}`)}
                <button onClick={() => toggleVibe(v)} className="ml-1 text-xs">&times;</button>
              </Badge>
            ))}
            {minCapacity > 0 && (
              <Badge variant="secondary" className="gap-1">
                {minCapacity}+ {t("common.people")}
                <button onClick={() => { setMinCapacity(0); setPage(1) }} className="ml-1 text-xs">&times;</button>
              </Badge>
            )}
            {category && (
              <Badge variant="secondary" className="gap-1">
                {t(`search.${category === "team_hub" ? "teamHub" : "soloNook"}`)}
                <button onClick={() => { setCategory(""); setPage(1) }} className="ml-1 text-xs">&times;</button>
              </Badge>
            )}
            {verifiedOnly && (
              <Badge variant="secondary" className="gap-1">
                {t("search.verifiedOnly")}
                <button onClick={() => { setVerifiedOnly(false); setPage(1) }} className="ml-1 text-xs">&times;</button>
              </Badge>
            )}
            {noiseLevelMin > 0 && (
              <Badge variant="secondary" className="gap-1">
                {t("common.quiet")} {noiseLevelMin}+
                <button onClick={() => { setNoiseLevelMin(0); setPage(1) }} className="ml-1 text-xs">&times;</button>
              </Badge>
            )}
            {selectedDate && (
              <Badge variant="secondary" className="gap-1">
                {selectedDate.toLocaleDateString()}
                <button onClick={() => { setSelectedDate(undefined); setPage(1) }} className="ml-1 text-xs">&times;</button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* Desktop Filters */}
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-border bg-card p-4">
            <h3 className="mb-4 font-semibold text-card-foreground">{t("search.filters")}</h3>
            {renderFilterPanel()}
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          {viewMode === "list" ? (
            <>
              {results.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((room) => (
                    <RoomCard key={room.id} room={room} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-16 text-center">
                  <Search className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium text-foreground">{t("common.noResults")}</p>
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    {t("search.clearFilters")}
                  </Button>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("search.prev")}
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      size="sm"
                      className="min-w-[36px]"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    {t("search.next")}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Map View — Leaflet (client-only) */
            <div className="h-[600px] overflow-hidden rounded-xl border border-border">
              <RoomMap rooms={results} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-semibold text-muted-foreground">Loading search results...</p>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}

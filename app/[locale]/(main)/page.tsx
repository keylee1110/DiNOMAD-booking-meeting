"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/context"
import { rooms } from "@/lib/data/rooms"
import { RoomCard } from "@/components/room-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, Users, CalendarDays, ArrowRight, BadgeCheck, Building2, BarChart3 } from "lucide-react"

const districts = ["Thu Duc", "District 1", "District 7", "District 10", "Binh Thanh"]

export default function LandingPage() {
  const { locale, t } = useTranslation()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [district, setDistrict] = useState("")
  const [capacity, setCapacity] = useState("")
  const [activeTab, setActiveTab] = useState<"team_hub" | "solo_nook">("team_hub")

  const featuredRooms = rooms
    .filter((r) => r.verified && r.category === activeTab)
    .slice(0, 4)

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (district) params.set("district", district)
    if (capacity) params.set("capacity", capacity)
    router.push(`/${locale}/search?${params.toString()}`)
  }

  const quickFilters = [
    { label: t("landing.hasTV"), param: "amenities=tv" },
    { label: t("landing.ultraQuiet"), param: "vibes=ultra_quiet" },
    { label: t("landing.under100k"), param: "maxPrice=100000" },
    { label: t("landing.coldAC"), param: "amenities=ac" },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero Section - Centered & Layered Depth */}
      <section className="relative overflow-hidden pt-32 pb-24 md:pt-48 md:pb-32 bg-secondary/20">
        {/* Modern Background Decorations */}
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
          <h1 className="text-[3rem] font-bold leading-[1.1] tracking-tight text-foreground md:text-[5rem] lg:text-[6.5rem] mb-8">
            {t("landing.heroTitle")}
          </h1>
          <p className="mx-auto mt-6 text-lg font-medium text-muted-foreground md:text-xl max-w-2xl leading-relaxed">
            {t("landing.heroSubtitle")}
          </p>
        </div>
      </section>

          {/* Search Control - Floating Glassmorphic Container */}
          <div className="relative z-20 -mt-16 mx-auto w-full max-w-4xl px-4">
            <div className="backdrop-blur-2xl bg-white/70 border border-white/50 p-5 rounded-3xl shadow-2xl flex flex-col gap-4">

              {/* Main search row */}
              <div className="flex flex-col md:flex-row gap-3 items-stretch">
                {/* Search Term */}
                <div className="flex flex-1 items-center gap-3 rounded-2xl border border-border/50 bg-background/60 px-4 h-14 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder={t("landing.searchPlaceholder")}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-full border-0 bg-transparent p-0 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/60"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>

                {/* District Select */}
                <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-background/60 px-4 h-14 min-w-[160px] focus-within:border-primary/50 transition-all">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Select value={district} onValueChange={setDistrict}>
                    <SelectTrigger className="h-full border-0 bg-transparent p-0 text-sm focus:ring-0 [&>svg]:ml-auto">
                      <SelectValue placeholder={t("landing.allDistricts")} />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Capacity Select */}
                <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-background/60 px-4 h-14 min-w-[130px] focus-within:border-primary/50 transition-all">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Select value={capacity} onValueChange={setCapacity}>
                    <SelectTrigger className="h-full border-0 bg-transparent p-0 text-sm focus:ring-0 [&>svg]:ml-auto">
                      <SelectValue placeholder={t("landing.capacity")} />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 4, 6, 8, 10, 12].map((n) => (
                        <SelectItem key={n} value={n.toString()}>{n}+ người</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Search Button */}
                <Button
                  onClick={handleSearch}
                  className="h-14 px-7 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 shrink-0 text-sm"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {t("landing.searchButton")}
                </Button>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/30">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mr-1">{t("landing.quickFilters")}:</span>
                {quickFilters.map((f) => (
                  <Badge
                    key={f.param}
                    variant="outline"
                    className="rounded-full text-xs cursor-pointer border-border/50 bg-white/30 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all duration-200"
                    onClick={() => router.push(`/${locale}/search?${f.param}`)}
                  >
                    {f.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

      {/* Featured Rooms */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl font-bold tracking-tight text-foreground mb-4">{t("landing.featured")}</h2>
              <p className="text-lg text-muted-foreground">{t("landing.featuredSubtitle")}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Modern Segmented Control for Categories */}
              <div className="flex p-1 bg-muted rounded-xl">
                <button
                  onClick={() => setActiveTab("team_hub")}
                  className={`px-6 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${activeTab === "team_hub" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-background/40"}`}
                >
                  Team Hubs
                </button>
                <button
                  onClick={() => setActiveTab("solo_nook")}
                  className={`px-6 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${activeTab === "solo_nook" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-background/40"}`}
                >
                  Solo Nooks
                </button>
              </div>

              <Button variant="outline" onClick={() => router.push(`/${locale}/search`)} className="hidden md:flex">
                {t("common.viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" onClick={() => router.push(`/${locale}/search`)} className="w-full">
              {t("common.viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works - Premium Steps */}
      <section className="bg-muted/30 py-24 md:py-32 rounded-[3.5rem] mx-4 mb-24">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="mb-20 text-4xl font-bold tracking-tight text-foreground">
            {t("landing.howItWorks")}
          </h2>
          <div className="grid gap-12 md:grid-cols-3">
            {[
              { icon: Search, title: t("landing.step1Title"), desc: t("landing.step1Desc"), step: "01" },
              { icon: CalendarDays, title: t("landing.step2Title"), desc: t("landing.step2Desc"), step: "02" },
              { icon: BadgeCheck, title: t("landing.step3Title"), desc: t("landing.step3Desc"), step: "03" },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="group relative flex flex-col items-center bg-background/50 backdrop-blur-sm p-10 rounded-[2.5rem] border border-border/50 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-primary/5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-8 transition-transform duration-500 group-hover:scale-110">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="mb-4 text-2xl font-bold text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-16 text-center text-4xl font-bold tracking-tight text-foreground">{t("landing.trustTitle")}</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: BadgeCheck, label: t("landing.verifiedListings"), color: "text-primary" },
              { icon: Building2, label: t("landing.partnersCount"), color: "text-primary" },
              { icon: BarChart3, label: t("landing.bookingsCount"), color: "text-primary" },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="group flex flex-col items-center p-10 rounded-3xl border border-border/50 bg-card/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20">
                  <div className="mb-6 rounded-2xl bg-primary/5 p-4 transition-transform duration-500 group-hover:scale-110">
                    <Icon className={`h-12 w-12 ${item.color}`} />
                  </div>
                  <span className="text-xl font-bold text-card-foreground text-center line-clamp-2">{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}


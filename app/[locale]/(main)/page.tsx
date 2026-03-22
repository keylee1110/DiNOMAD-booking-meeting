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
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b-2 border-primary bg-background pt-24 pb-16 md:pt-32 md:pb-24">
        {/* Geometric Background Element */}
        <div className="absolute top-0 right-0 hidden h-full w-1/2 -skew-x-12 translate-x-32 bg-primary/10 lg:block pointer-events-none" />

        <div className="mx-auto flex max-w-7xl flex-col px-4 md:flex-row md:items-center">

          {/* Left: Typography */}
          <div className="z-10 flex-1 md:pr-12">
            <h1 className="text-[3.5rem] font-black uppercase leading-[0.85] tracking-tighter text-foreground md:text-[5rem] lg:text-[6.5rem]">
              {t("landing.heroTitle")}
            </h1>
            <p className="mt-6 border-l-4 border-primary pl-4 text-lg font-medium text-muted-foreground md:text-xl max-w-md">
              {t("landing.heroSubtitle")}
            </p>
          </div>

          {/* Right: Search Box Brutalist */}
          <div className="z-10 mt-12 w-full md:mt-0 md:w-[400px] lg:w-[450px] shrink-0">
            <div className="flex flex-col gap-4 border-2 border-primary bg-card p-6 shadow-[8px_8px_0px_0px_#64B5F6] transition-transform hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_#64B5F6]">

              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Search className="h-3.5 w-3.5 text-primary" />
                  {t("common.search")}
                </label>
                <Input
                  placeholder={t("landing.searchPlaceholder")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="rounded-none border-2 border-border bg-background focus-visible:ring-0 focus-visible:border-primary"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {t("landing.district")}
                  </label>
                  <Select value={district} onValueChange={setDistrict}>
                    <SelectTrigger className="rounded-none border-2 border-border bg-background focus:ring-0 focus:border-primary">
                      <SelectValue placeholder={t("landing.allDistricts")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-2 border-primary">
                      {districts.map((d) => (
                        <SelectItem key={d} value={d} className="rounded-none focus:bg-primary/20">{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    {t("landing.capacity")}
                  </label>
                  <Select value={capacity} onValueChange={setCapacity}>
                    <SelectTrigger className="rounded-none border-2 border-border bg-background focus:ring-0 focus:border-primary">
                      <SelectValue placeholder="1-12+" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-2 border-primary">
                      {[2, 4, 6, 8, 10, 12].map((n) => (
                        <SelectItem key={n} value={n.toString()} className="rounded-none focus:bg-primary/20">{n}+</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleSearch}
                className="mt-2 rounded-none border-2 border-transparent bg-primary text-primary-foreground hover:bg-foreground hover:text-background font-bold uppercase tracking-wider transition-colors"
                size="lg"
              >
                <Search className="mr-2 h-4 w-4" />
                {t("landing.searchButton")}
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-foreground">{t("landing.quickFilters")}:</span>
              {quickFilters.map((f) => (
                <Badge
                  key={f.param}
                  variant="outline"
                  className="rounded-none border-2 border-border cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  onClick={() => router.push(`/${locale}/search?${f.param}`)}
                >
                  {f.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="border-b-2 border-border py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">{t("landing.featured")}</h2>
              <p className="mt-2 text-sm font-medium text-muted-foreground border-l-2 border-primary pl-3">{t("landing.featuredSubtitle")}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Tabs for Categories */}
              <div className="flex items-center gap-2">
                <Button
                  variant={activeTab === "team_hub" ? "default" : "outline"}
                  onClick={() => setActiveTab("team_hub")}
                  className={`rounded-none font-bold uppercase tracking-wider border-2 ${activeTab === "team_hub" ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                >
                  Team Hubs
                </Button>
                <Button
                  variant={activeTab === "solo_nook" ? "default" : "outline"}
                  onClick={() => setActiveTab("solo_nook")}
                  className={`rounded-none font-bold uppercase tracking-wider border-2 ${activeTab === "solo_nook" ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                >
                  Solo Nooks
                </Button>
              </div>

              <Button variant="outline" onClick={() => router.push(`/${locale}/search`)} className="rounded-none border-2 border-foreground hover:bg-foreground hover:text-background hidden md:flex font-bold uppercase">
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
            <Button variant="outline" onClick={() => router.push(`/${locale}/search`)} className="w-full rounded-none border-2 border-foreground hover:bg-foreground hover:text-background font-bold uppercase">
              {t("common.viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b-2 border-border bg-muted/20 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-12 text-center text-3xl font-black uppercase text-foreground">
            <span className="bg-primary text-primary-foreground px-4 py-1 inline-block -rotate-2">{t("landing.howItWorks")}</span>
          </h2>
          <div className="grid gap-8 md:grid-cols-3 md:gap-12 lg:gap-16">
            {[
              { icon: Search, title: t("landing.step1Title"), desc: t("landing.step1Desc"), step: "01" },
              { icon: CalendarDays, title: t("landing.step2Title"), desc: t("landing.step2Desc"), step: "02" },
              { icon: BadgeCheck, title: t("landing.step3Title"), desc: t("landing.step3Desc"), step: "03" },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="relative flex flex-col border-2 border-border bg-background p-6 transition-transform hover:-translate-y-2 hover:border-primary hover:shadow-[8px_8px_0px_0px_#64B5F6]">
                  <div className="absolute -top-5 -right-5 flex h-10 w-10 items-center justify-center border-2 border-primary bg-primary text-primary-foreground font-black text-lg shadow-[4px_4px_0px_0px_var(--color-foreground)] z-10">
                    {item.step}
                  </div>
                  <Icon className="mb-4 h-10 w-10 text-primary" />
                  <h3 className="mb-2 text-xl font-black uppercase text-foreground">{item.title}</h3>
                  <p className="text-sm font-medium text-muted-foreground">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-10 text-center text-3xl font-black uppercase text-foreground">{t("landing.trustTitle")}</h2>
          <div className="grid gap-6 md:grid-cols-3 lg:gap-12">
            {[
              { icon: BadgeCheck, label: t("landing.verifiedListings"), color: "text-foreground" },
              { icon: Building2, label: t("landing.partnersCount"), color: "text-primary" },
              { icon: BarChart3, label: t("landing.bookingsCount"), color: "text-muted-foreground" },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex flex-col flex-1 items-center border-2 border-border bg-card p-8 text-center transition-all hover:border-primary hover:shadow-[6px_6px_0px_0px_#64B5F6]">
                  <Icon className={`mb-4 h-12 w-12 ${item.color}`} />
                  <span className="text-xl font-black uppercase text-card-foreground">{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

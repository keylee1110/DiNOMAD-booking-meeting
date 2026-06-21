"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/lib/i18n/context"
import { getLocalizedRoom } from "@/lib/data/rooms"
import { getPublicRooms } from "@/lib/api/public-rooms"
import { selectCustomerRooms } from "@/lib/booking/check-in"
import { RoomCard } from "@/components/room-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, Users, CalendarDays, ArrowRight, BadgeCheck, Building2, BarChart3, ShieldCheck, Zap, Building, Award, Star, Quote, CheckCircle2, TrendingUp } from "lucide-react"

const districts = ["Thu Duc", "District 1", "District 7", "District 10", "Binh Thanh"]

export default function LandingPage() {
  const { locale, t } = useTranslation()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [district, setDistrict] = useState("")
  const [capacity, setCapacity] = useState("")
  const [activeTab, setActiveTab] = useState<"team_hub" | "solo_nook">("team_hub")
  const [availableRooms, setAvailableRooms] = useState<any[]>([])
  const [roomsLoading, setRoomsLoading] = useState(true)

  useEffect(() => {
    getPublicRooms()
      .then((publicRooms) => {
        setAvailableRooms(publicRooms)
      })
      .catch((error) => console.warn("Could not load published partner rooms:", error))
      .finally(() => setRoomsLoading(false))
  }, [])

  const featuredRooms = availableRooms
    .map((r) => getLocalizedRoom(r, locale))
    .filter((r) => r.category === activeTab)
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
    <div className="flex flex-col bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-12 md:pt-24 md:pb-20">
        {/* Soft Ambient Glows */}
        <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

        <div className="mx-auto flex max-w-7xl flex-col px-4 md:flex-row md:items-start md:gap-12 md:pt-2">

          {/* Left: Typography (Shifted Up & Beautifully Animated) */}
          <div className="z-10 flex-1 md:pr-12 flex flex-col gap-8 md:-mt-8 md:-translate-y-2 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="space-y-4">
              <h1 className="text-4xl font-black leading-[1.15] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl uppercase">
                {t("landing.heroTitle")}
              </h1>
              <p className="text-base text-muted-foreground md:text-lg max-w-lg leading-relaxed">
                {t("landing.heroSubtitle")}
              </p>
            </div>

            {/* Core Workspace Features (Fade-in cascade) */}
            <div className="grid grid-cols-2 gap-4 max-w-md pt-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              {[
                { icon: ShieldCheck, title: locale === "vi" ? "Bảo mật Đặt cọc" : "Safe Deposits", desc: locale === "vi" ? "Chính sách cọc 20% linh hoạt" : "Flexible 20% booking locks" },
                { icon: Zap, title: locale === "vi" ? "Check-in Tức thì" : "Instant Check-in", desc: locale === "vi" ? "Mã QR mở cửa trong 2 giây" : "Get in with a quick scan" },
                { icon: Building, title: locale === "vi" ? "Không gian Đa dạng" : "Diverse Spaces", desc: locale === "vi" ? "Solo Nooks & Phòng họp lớn" : "For focused work & teams" },
                { icon: Award, title: locale === "vi" ? "Không phí dịch vụ" : "Zero Hidden Fees", desc: locale === "vi" ? "Cam kết giá gốc tốt nhất" : "Best rates directly guaranteed" },
              ].map((f, i) => {
                const Icon = f.icon
                return (
                  <div key={i} className="flex gap-3 items-start p-3.5 rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm shadow-sm transition-all hover:border-primary/20">
                    <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">{f.title}</h4>
                      <p className="text-[10px] text-muted-foreground font-semibold leading-normal">{f.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Trusted Statistics Banner (Fade-in cascade) */}
            <div className="flex items-center gap-8 border-t border-border/40 pt-6 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <div>
                <p className="text-2xl font-black text-primary">50+</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{locale === "vi" ? "Không gian liên kết" : "Premium Spaces"}</p>
              </div>
              <div className="h-8 w-px bg-border/40" />
              <div>
                <p className="text-2xl font-black text-primary">12K+</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{locale === "vi" ? "Giờ đã phục vụ" : "Booked Hours"}</p>
              </div>
              <div className="h-8 w-px bg-border/40" />
              <div>
                <p className="text-2xl font-black text-primary">4.9★</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{locale === "vi" ? "Đánh giá từ khách" : "Average Rating"}</p>
              </div>
            </div>
          </div>

          {/* Right: Search Box Premium (Slide-in-from-right animation) */}
          <div className="z-10 mt-12 w-full md:mt-0 md:w-[400px] lg:w-[450px] shrink-0 animate-in fade-in slide-in-from-right-10 duration-1000">
            <div className="flex flex-col gap-4 border border-border/50 bg-card p-6 rounded-2xl shadow-[0_10px_30px_-10px_rgba(41,35,30,0.08)] transition-all duration-300 hover:shadow-[0_15px_40px_-10px_rgba(41,35,30,0.12)]">

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Search className="h-3.5 w-3.5 text-primary" />
                  {t("common.search")}
                </label>
                <Input
                  placeholder={t("landing.searchPlaceholder")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="rounded-xl border border-border/80 bg-background focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-transparent transition-all"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {t("landing.district")}
                  </label>
                  <Select value={district} onValueChange={setDistrict}>
                    <SelectTrigger className="rounded-xl border border-border/80 bg-background focus:ring-2 focus:ring-ring/50 transition-all">
                      <SelectValue placeholder={t("landing.allDistricts")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-border/80 p-1 shadow-lg bg-card">
                      {districts.map((d) => (
                        <SelectItem key={d} value={d} className="rounded-lg transition-colors">{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    {t("landing.capacity")}
                  </label>
                  <Select value={capacity} onValueChange={setCapacity}>
                    <SelectTrigger className="rounded-xl border border-border/80 bg-background focus:ring-2 focus:ring-ring/50 transition-all">
                      <SelectValue placeholder="1-12+" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-border/80 p-1 shadow-lg bg-card">
                      {[2, 4, 6, 8, 10, 12].map((n) => (
                        <SelectItem key={n} value={n.toString()} className="rounded-lg transition-colors">{n}+</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleSearch}
                className="mt-2 w-full font-bold shadow-sm"
                size="lg"
              >
                <Search className="mr-2 h-4 w-4" />
                {t("landing.searchButton")}
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground">{t("landing.quickFilters")}:</span>
              {quickFilters.map((f) => (
                <Badge
                  key={f.param}
                  variant="outline"
                  className="rounded-full border border-border/80 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm px-3 py-1"
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
      <section className="border-b border-border/40 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">{t("landing.featured")}</h2>
              <p className="mt-2 text-sm font-medium text-muted-foreground border-l border-primary/60 pl-3">{t("landing.featuredSubtitle")}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Tabs for Categories */}
              <div className="flex items-center gap-2">
                <Button
                  variant={activeTab === "team_hub" ? "default" : "outline"}
                  onClick={() => setActiveTab("team_hub")}
                  className="rounded-xl font-semibold tracking-tight"
                >
                  Team Hubs
                </Button>
                <Button
                  variant={activeTab === "solo_nook" ? "default" : "outline"}
                  onClick={() => setActiveTab("solo_nook")}
                  className="rounded-xl font-semibold tracking-tight"
                >
                  Solo Nooks
                </Button>
              </div>

              <Button variant="outline" onClick={() => router.push(`/${locale}/search`)} className="rounded-xl font-semibold hidden md:flex">
                {t("common.viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
            {roomsLoading ? (
              // Skeleton cards while loading
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border/40 bg-card animate-pulse">
                  <div className="aspect-[4/3] bg-muted/50" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 w-3/4 rounded-lg bg-muted/60" />
                    <div className="h-4 w-1/2 rounded-lg bg-muted/40" />
                    <div className="h-4 w-2/3 rounded-lg bg-muted/30" />
                    <div className="h-8 w-full rounded-lg bg-muted/30 mt-4" />
                  </div>
                </div>
              ))
            ) : featuredRooms.length > 0 ? (
              featuredRooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                <p className="text-sm font-medium">{t("landing.noRooms")}</p>
              </div>
            )}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Button variant="outline" onClick={() => router.push(`/${locale}/search`)} className="w-full rounded-xl font-semibold">
              {t("common.viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works - Visual Stepper */}
      <section className="relative border-b border-border/40 bg-gradient-to-b from-muted/10 to-background py-20 md:py-28 overflow-hidden">
        {/* Ambient decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/3 blur-[140px]" />
          <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-accent/3 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4">
          <div className="mb-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-5">
              <Zap className="h-3 w-3" />
              {t("landing.howItWorks")}
            </span>
            <h2 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
              {t("landing.howItWorks")}
            </h2>
            <p className="mt-3 text-base text-muted-foreground max-w-xl mx-auto font-medium">
              {t("landing.howItWorksSubtitle")}
            </p>
          </div>

          <div className="relative grid gap-6 md:grid-cols-3">
            {/* Connector line (desktop only) */}
            <div className="hidden md:block absolute top-[52px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-primary/20 via-primary/60 to-primary/20 z-0" />

            {[
              {
                icon: Search,
                title: t("landing.step1Title"),
                desc: t("landing.step1Desc"),
                step: "01",
                tag: t("landing.step1Tag"),
                delay: "delay-100",
                detail: locale === "vi" ? "Lọc theo quận, sức chứa, giá cả, tiện nghi" : "Filter by district, capacity, price & amenities",
              },
              {
                icon: CalendarDays,
                title: t("landing.step2Title"),
                desc: t("landing.step2Desc"),
                step: "02",
                tag: t("landing.step2Tag"),
                delay: "delay-200",
                detail: locale === "vi" ? "Chọn khung giờ, nhập thông tin, thanh toán online" : "Pick time slots, enter details, pay online",
              },
              {
                icon: BadgeCheck,
                title: t("landing.step3Title"),
                desc: t("landing.step3Desc"),
                step: "03",
                tag: t("landing.step3Tag"),
                delay: "delay-300",
                detail: locale === "vi" ? "Nhận mã QR tức thì, quét cửa và bắt đầu làm việc" : "Get instant QR code, scan the door and get to work",
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.step} className={`relative z-10 flex flex-col gap-5 border border-border/50 bg-card p-7 rounded-2xl transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 hover:shadow-[0_12px_40px_-10px_rgba(100,181,246,0.15)] animate-in fade-in slide-in-from-bottom-6 duration-700 ${item.delay}`}>
                  {/* Step badge + icon row */}
                  <div className="flex items-center justify-between">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-lg shadow-[0_4px_16px_-4px_rgba(100,181,246,0.5)]">
                      {item.step}
                      <div className="absolute -inset-1 rounded-2xl bg-primary/20 blur-sm -z-10" />
                    </div>
                    <span className="rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">{item.tag}</span>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-5 w-5 text-primary shrink-0" />
                      <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                  </div>

                  {/* Detail chip */}
                  <div className="mt-auto flex items-start gap-2 rounded-xl border border-border/40 bg-muted/30 p-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] font-semibold text-muted-foreground leading-snug">{item.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-border/40 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/30 rounded-2xl overflow-hidden border border-border/30 shadow-sm">
            {[
              { value: "10K+", label: t("landing.statsBookings"), icon: TrendingUp },
              { value: "50+", label: t("landing.statsVenues"), icon: Building2 },
              { value: "4.9★", label: t("landing.statsRating"), icon: Star },
              { value: "5", label: t("landing.statsDistricts"), icon: MapPin },
            ].map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={i} className="flex flex-col items-center gap-3 bg-card px-6 py-10 text-center transition-colors hover:bg-primary/3 group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/8 text-primary group-hover:bg-primary/15 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-3xl font-black text-foreground tracking-tight">{stat.value}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-b border-border/40 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-14 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-5">
              <Star className="h-3 w-3" />
              {locale === "vi" ? "Đánh giá" : "Reviews"}
            </span>
            <h2 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
              {t("landing.testimonialsTitle")}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground font-medium max-w-lg mx-auto">
              {t("landing.testimonialsSubtitle")}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                text: t("landing.review1Text"),
                author: t("landing.review1Author"),
                role: t("landing.review1Role"),
                rating: 5,
                avatar: "MK",
                delay: "delay-100",
                color: "from-blue-500/20 to-cyan-500/20",
              },
              {
                text: t("landing.review2Text"),
                author: t("landing.review2Author"),
                role: t("landing.review2Role"),
                rating: 5,
                avatar: "LN",
                delay: "delay-200",
                color: "from-primary/20 to-blue-400/20",
              },
              {
                text: t("landing.review3Text"),
                author: t("landing.review3Author"),
                role: t("landing.review3Role"),
                rating: 5,
                avatar: "TT",
                delay: "delay-300",
                color: "from-cyan-500/20 to-primary/20",
              },
            ].map((review, i) => (
              <div key={i} className={`relative flex flex-col gap-5 rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/20 hover:shadow-md animate-in fade-in slide-in-from-bottom-6 duration-700 ${review.delay}`}>
                {/* Quote icon */}
                <Quote className="h-7 w-7 text-primary/25 shrink-0" />

                {/* Stars */}
                <div className="flex gap-0.5 -mt-2">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Review text */}
                <p className="text-sm text-muted-foreground font-medium leading-relaxed flex-1">"{review.text}"</p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-3 border-t border-border/40">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${review.color} border border-primary/15 text-xs font-black text-primary`}>
                    {review.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{review.author}</p>
                    <p className="text-[11px] font-semibold text-muted-foreground">{review.role}</p>
                  </div>
                  <BadgeCheck className="ml-auto h-4 w-4 text-primary/70" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/8 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-primary/6 blur-[120px] pointer-events-none" />

        <div className="relative mx-auto max-w-3xl px-4 text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-6">
            <Zap className="h-3 w-3" />
            DiNOMAD
          </span>

          <h2 className="text-4xl font-black tracking-tight text-foreground md:text-5xl lg:text-6xl mb-4">
            {t("landing.ctaTitle")}
          </h2>
          <p className="text-base text-muted-foreground font-medium mb-10 max-w-lg mx-auto">
            {t("landing.ctaSubtitle")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => router.push(`/${locale}/search`)}
              className="rounded-2xl px-8 font-bold shadow-[0_6px_24px_-6px_rgba(100,181,246,0.5)] hover:shadow-[0_8px_32px_-6px_rgba(100,181,246,0.6)] transition-all hover:-translate-y-0.5 text-base"
            >
              <Search className="mr-2 h-5 w-5" />
              {t("landing.ctaButton")}
            </Button>

            <div className="flex flex-col items-center sm:items-start gap-0.5">
              <span className="text-xs font-semibold text-muted-foreground">{t("landing.ctaPartner")}</span>
              <button
                onClick={() => router.push(`/${locale}/signup?role=supplier`)}
                className="text-sm font-bold text-primary hover:underline underline-offset-2 transition-all cursor-pointer"
              >
                {t("landing.ctaPartnerLink")}
              </button>
            </div>
          </div>

          {/* Trust chips */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {[
              locale === "vi" ? "✓ Đặt phòng trong 60 giây" : "✓ Book in 60 seconds",
              locale === "vi" ? "✓ Không phí ẩn" : "✓ No hidden fees",
              locale === "vi" ? "✓ Check-in bằng QR Code" : "✓ QR Code check-in",
              locale === "vi" ? "✓ Hủy linh hoạt" : "✓ Flexible cancellation",
            ].map((chip) => (
              <span key={chip} className="rounded-full border border-border/60 bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

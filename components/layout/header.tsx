"use client"

import Link from "next/link"
import { useTranslation } from "@/lib/i18n/context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Menu, X, MapPin } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function Header() {
  const { locale, t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <MapPin className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Di<span className="text-primary">NOMAD</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href={`/${locale}`}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("common.home")}
          </Link>
          <Link
            href={`/${locale}/search`}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("common.search")}
          </Link>
          <Link
            href={`/${locale}/partner`}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("common.partnerPortal")}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link
              href={`/${locale}`}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setMenuOpen(false)}
            >
              {t("common.home")}
            </Link>
            <Link
              href={`/${locale}/search`}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setMenuOpen(false)}
            >
              {t("common.search")}
            </Link>
            <Link
              href={`/${locale}/partner`}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setMenuOpen(false)}
            >
              {t("common.partnerPortal")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}

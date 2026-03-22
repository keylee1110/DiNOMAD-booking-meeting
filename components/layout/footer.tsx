"use client"

import Link from "next/link"
import Image from "next/image"
import { useTranslation } from "@/lib/i18n/context"

export function Footer() {
  const { locale, t } = useTranslation()

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link href={`/${locale}`} className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-transparent">
                <Image 
                  src="/logo.png" 
                  alt="DiNOMAD Logo" 
                  width={40} 
                  height={40} 
                  className="object-contain h-full w-auto"
                />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                Di<span className="text-primary">NOMAD</span>
              </span>
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              {locale === "vi"
                ? "Nen tang dat phong hop cho sinh vien va freelancer tai TP.HCM"
                : "Meeting room booking platform for students and freelancers in HCMC"}
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              {locale === "vi" ? "Lien Ket" : "Links"}
            </h4>
            <ul className="flex flex-col gap-2">
              <li>
                <Link href={`/${locale}/search`} className="text-sm text-muted-foreground hover:text-foreground">
                  {t("common.search")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/login`} className="text-sm text-muted-foreground hover:text-foreground">
                  Partner Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              {locale === "vi" ? "Khu Vuc" : "Districts"}
            </h4>
            <ul className="flex flex-col gap-2">
              {["Thu Duc", "District 1", "District 7", "District 10", "Binh Thanh"].map((d) => (
                <li key={d}>
                  <Link
                    href={`/${locale}/search?district=${encodeURIComponent(d)}`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {d}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              {locale === "vi" ? "Lien He" : "Contact"}
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>hello@dinomad.vn</li>
              <li>028-1234-5678</li>
              <li>Ho Chi Minh City, Vietnam</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} DiNOMAD. {locale === "vi" ? "Moi quyen duoc bao luu." : "All rights reserved."}
        </div>
      </div>
    </footer>
  )
}

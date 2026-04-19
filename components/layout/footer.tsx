"use client"

import Link from "next/link"
import Image from "next/image"
import { useTranslation } from "@/lib/i18n/context"

export function Footer() {
  const { locale, t } = useTranslation()

  return (
    <footer className="bg-secondary/10 border-t border-border/50">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="flex flex-col gap-6">
            <Link href={`/${locale}`} className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary/5 transition-transform duration-300 group-hover:scale-105">
                <Image 
                  src="/logo.png" 
                  alt="DiNOMAD Logo" 
                  width={40} 
                  height={40} 
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                Di<span className="text-primary">NOMAD</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground/80 font-medium">
              {locale === "vi"
                ? "Nền tảng đặt phòng họp, chỗ ngồi làm việc linh hoạt dành cho sinh viên và freelancer tại TP.HCM."
                : "The premium workspace booking platform for students and remote workers in Ho Chi Minh City."}
            </p>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-foreground">
              {locale === "vi" ? "Liên Kết" : "Explore"}
            </h4>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href={`/${locale}/search`} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  {t("common.search")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/login`} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  Partner Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-foreground">
              {locale === "vi" ? "Khu Vực" : "Districts"}
            </h4>
            <ul className="flex flex-col gap-3">
              {["Thu Duc", "District 1", "District 7", "District 10", "Binh Thanh"].map((d) => (
                <li key={d}>
                  <Link
                    href={`/${locale}/search?district=${encodeURIComponent(d)}`}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                  >
                    {d}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-widest text-foreground">
              {locale === "vi" ? "Liên Hệ" : "Connect"}
            </h4>
            <ul className="flex flex-col gap-4 text-sm font-medium text-muted-foreground">
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                hello@dinomad.vn
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                028-1234-5678
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Ho Chi Minh City, VN
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-20 border-t border-border/50 pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs font-semibold text-muted-foreground/60">
            &copy; {new Date().getFullYear()} DiNOMAD Global. {locale === "vi" ? "Mọi quyền được bảo lưu." : "All rights reserved."}
          </p>
          <div className="flex gap-8 text-xs font-semibold text-muted-foreground/60 transition-colors">
            <Link href="#" className="hover:text-primary">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>

  )
}

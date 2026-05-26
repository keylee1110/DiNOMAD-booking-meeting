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
                ? "Nền tảng đặt phòng họp cho sinh viên và freelancer tại TP.HCM"
                : "Meeting room booking platform for students and freelancers in HCMC"}
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              {locale === "vi" ? "Liên Kết" : "Links"}
            </h4>
            <ul className="flex flex-col gap-2">
              <li>
                <Link href={`/${locale}/search`} className="text-sm text-muted-foreground hover:text-foreground">
                  {t("common.search")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/login`} className="text-sm text-muted-foreground hover:text-foreground">
                  {locale === "vi" ? "Đăng nhập Đối tác" : "Partner Login"}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              {locale === "vi" ? "Khu Vực" : "Districts"}
            </h4>
            <ul className="flex flex-col gap-2">
              {["Thu Duc", "District 1", "District 7", "District 10", "Binh Thanh"].map((d) => {
                const label = locale === "vi" 
                  ? d === "Thu Duc" ? "Thủ Đức"
                    : d === "District 1" ? "Quận 1"
                    : d === "District 7" ? "Quận 7"
                    : d === "District 10" ? "Quận 10"
                    : d === "Binh Thanh" ? "Bình Thạnh"
                    : d
                  : d;
                return (
                  <li key={d}>
                    <Link
                      href={`/${locale}/search?district=${encodeURIComponent(d)}`}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              {locale === "vi" ? "Liên Hệ" : "Contact"}
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>hello@dinomad.vn</li>
              <li>028-1234-5678</li>
              <li>
                {locale === "vi" ? "Thành phố Hồ Chí Minh, Việt Nam" : "Ho Chi Minh City, Vietnam"}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} DiNOMAD. {locale === "vi" ? "Mọi quyền được bảo lưu." : "All rights reserved."}
        </div>
      </div>
    </footer>
  )
}

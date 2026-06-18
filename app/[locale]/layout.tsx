import type { Metadata } from "next"
import { getDictionary, isValidLocale } from "@/lib/i18n"
import type { Locale } from "@/lib/types"
import { I18nProvider } from "@/lib/i18n/context"
import { BookingProvider } from "@/lib/store/booking-store"
import { notFound } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === "vi" ? "DiNOMAD - Đặt Phòng Họp TP.HCM" : "DiNOMAD - Book Meeting Rooms in HCMC",
    description: locale === "vi"
      ? "Nền tảng đặt phòng họp cho sinh viên và freelancer tại TP.HCM. Đặt phòng trong 60 giây."
      : "Meeting room booking platform for students and freelancers in HCMC. Book in 60 seconds.",
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!isValidLocale(locale)) {
    notFound()
  }

  const dictionary = await getDictionary(locale as Locale)

  return (
    <I18nProvider locale={locale as Locale} dictionary={dictionary as any}>
      <BookingProvider>
        {children}
      </BookingProvider>
    </I18nProvider>
  )
}

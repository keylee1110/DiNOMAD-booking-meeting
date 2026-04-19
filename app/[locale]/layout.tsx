import type { Metadata } from "next"
import { getDictionary, isValidLocale } from "@/lib/i18n"
import type { Locale } from "@/lib/types"
import { I18nProvider } from "@/lib/i18n/context"
import { BookingProvider } from "@/lib/store/booking-store"
import { UserProvider } from "@/lib/store/user-store"
import { notFound } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === "vi" ? "DiNOMAD - Dat Phong Hop TP.HCM" : "DiNOMAD - Book Meeting Rooms in HCMC",
    description: locale === "vi"
      ? "Nen tang dat phong hop cho sinh vien va freelancer tai TP.HCM. Dat phong trong 60 giay."
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
      <UserProvider>
        <BookingProvider>
          {children}
        </BookingProvider>
      </UserProvider>
    </I18nProvider>
  )
}

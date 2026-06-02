import type { Metadata } from "next"
import { getDictionary, isValidLocale } from "@/lib/i18n"
import type { Locale, Dictionary } from "@/lib/types"
import { I18nProvider } from "@/lib/i18n/context"
import { AdminSidebar } from "./_components/admin-sidebar"
import { AdminHeader } from "./_components/admin-header"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "DiNOMAD Admin",
  description: "Admin dashboard for DiNOMAD platform management.",
}

export default async function AdminLayout({
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

  const dictionary = (await getDictionary(locale as Locale)) as any

  return (
    <I18nProvider locale={locale as Locale} dictionary={dictionary}>
      <div className="flex h-screen bg-background overflow-hidden antialiased">
        <AdminSidebar locale={locale} />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
            {children}
          </main>
        </div>
      </div>
    </I18nProvider>
  )
}

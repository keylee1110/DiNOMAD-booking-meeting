import type { Locale } from "@/lib/types"

const dictionaries = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  vi: () => import("./dictionaries/vi.json").then((m) => m.default),
}

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]()
}

export const locales: Locale[] = ["en", "vi"]
export const defaultLocale: Locale = "vi"

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

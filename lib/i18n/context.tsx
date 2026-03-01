"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { Locale } from "@/lib/types"

type DictionaryValue = string | Record<string, string>
type Dict = Record<string, DictionaryValue>

interface I18nContextType {
  locale: Locale
  dict: Dict
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale
  dictionary: Dict
  children: ReactNode
}) {
  const t = (key: string): string => {
    const parts = key.split(".")
    if (parts.length === 2) {
      const section = dictionary[parts[0]]
      if (typeof section === "object" && section !== null) {
        return (section as Record<string, string>)[parts[1]] ?? key
      }
    }
    const val = dictionary[key]
    if (typeof val === "string") return val
    return key
  }

  return (
    <I18nContext.Provider value={{ locale, dict: dictionary, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider")
  return ctx
}

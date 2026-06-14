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
    let current: any = dictionary
    for (const part of parts) {
      if (typeof current !== "object" || current === null) return key
      current = current[part]
    }
    return typeof current === "string" ? current : key
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

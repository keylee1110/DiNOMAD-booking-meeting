import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const locales = ["en", "vi"]
const defaultLocale = "vi"

function getLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get("DINOMAD_LOCALE")?.value
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale
  }

  const acceptLang = request.headers.get("accept-language")
  if (acceptLang) {
    const preferred = acceptLang.split(",").map((l) => l.split(";")[0].trim().substring(0, 2))
    for (const lang of preferred) {
      if (lang === "vi") return "vi"
      if (lang === "en") return "en"
    }
  }

  return defaultLocale
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files, api routes, and image paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/images") ||
    pathname.includes(".") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon")
  ) {
    return NextResponse.next()
  }

  // Check if the pathname already has a locale
  const hasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (hasLocale) {
    return NextResponse.next()
  }

  // Redirect to the detected locale
  const locale = getLocale(request)
  const newUrl = new URL(`/${locale}${pathname}`, request.url)
  newUrl.search = request.nextUrl.search
  return NextResponse.redirect(newUrl)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|images|api).*)"],
}

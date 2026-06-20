import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { updateSession } from "@/utils/supabase/middleware"

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

export async function proxy(request: NextRequest) {
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

  // 1. Update Supabase session
  const response = await updateSession(request)

  // 2. Check if the pathname already has a locale
  const hasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (hasLocale) {
    return response
  }

  // 3. Redirect to the detected locale
  const locale = getLocale(request)
  const newUrl = new URL(`/${locale}${pathname}`, request.url)
  newUrl.search = request.nextUrl.search

  // Create redirect response
  const redirectResponse = NextResponse.redirect(newUrl)

  // Copy all set cookies from Supabase updateSession response to the redirect
  // response — preserving the full cookie OBJECT (path, maxAge, sameSite,
  // httpOnly, secure). Copying only name+value drops these options and corrupts
  // the auth cookie, logging the user out on the next request.
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie)
  })

  return redirectResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|images|api).*)"],
}


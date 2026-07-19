import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("redirect_to") || "/"
  const mode = searchParams.get("mode") || "login"
  const roleParam = searchParams.get("role")

  // Determine locale from redirect path if possible
  const pathParts = next.split("/")
  const locale = pathParts[1] === "en" ? "en" : "vi"

  if (code) {
    // 1. Create redirect response first
    let targetRedirect = next
    const response = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                request.cookies.set(name, value)
                response.cookies.set(name, value, options)
              })
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing sessions.
            }
          },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Fetch current user profile to determine their actual role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        const actualRole = profile?.role || "customer"

        const roleHome = actualRole === "admin"
          ? `/${locale}/admin`
          : actualRole === "supplier" ? `/${locale}/partner` : `/${locale}`
        const canUseRequestedRedirect = next.startsWith(`/${locale}/admin`)
          ? actualRole === "admin"
          : next.startsWith(`/${locale}/partner`)
            ? actualRole === "supplier" || actualRole === "admin"
            : next.startsWith(`/${locale}`)

        if (mode === "signup" && roleParam === "supplier" && actualRole !== "supplier") {
          // Partners submit real business details on the application page —
          // no auto-created placeholder application anymore.
          targetRedirect = `/${locale}/become-partner`
        } else {
          targetRedirect = canUseRequestedRedirect ? next : roleHome
        }
      }

      // Re-create the final response to point to the correct redirect url while preserving cookies
      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"
      
      let redirectUrl = `${origin}${targetRedirect}`
      if (!isLocalEnv && forwardedHost) {
        redirectUrl = `https://${forwardedHost}${targetRedirect}`
      }

      const finalResponse = NextResponse.redirect(redirectUrl)
      
      // copy cookies
      response.cookies.getAll().forEach(cookie => {
        finalResponse.cookies.set(cookie.name, cookie.value, {
          path: cookie.path,
          domain: cookie.domain,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          sameSite: cookie.sameSite,
          expires: cookie.expires,
        })
      })

      return finalResponse
    }
  }

  // Return the user to a fallback error or login page
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`)
}

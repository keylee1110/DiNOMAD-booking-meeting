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
            } catch (err) {
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

        let actualRole = profile?.role || "customer"

        // If the user signed up as a supplier, and is registering
        if (mode === "signup" && roleParam === "supplier") {
          // Check if they are already linked to a supplier
          const { data: memberData } = await supabase
            .from("supplier_members")
            .select("supplier_id")
            .eq("user_id", user.id)

          if (!memberData || memberData.length === 0) {
            // Call the RPC to submit supplier application
            const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "New Partner"
            const phone = user.user_metadata?.phone || ""
            
            const { error: rpcError } = await supabase.rpc("submit_supplier_application", {
              legal_name: fullName,
              display_name: `${fullName} Space`,
              business_email: user.email || "",
              business_phone: phone,
              onboarding_note: "Auto-submitted during OAuth Partner registration"
            })

            if (rpcError) {
              console.error("Partner creation RPC failed in OAuth callback:", rpcError)
            }
          }
        }

        // Fetch profile role again in case it changed
        const { data: updatedProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        actualRole = updatedProfile?.role || actualRole

        // Deciding Redirection based on actualRole and request target url
        if (next === "/" || next === `/${locale}` || !next) {
          if (actualRole === "admin") {
            targetRedirect = `/${locale}/admin`
          } else if (actualRole === "supplier") {
            targetRedirect = `/${locale}/partner`
          } else if (mode === "signup" && roleParam === "supplier") {
            // If they registered as supplier, redirect to profile page where they see pending state
            targetRedirect = `/${locale}/profile?pending=true`
          } else {
            targetRedirect = `/${locale}`
          }
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

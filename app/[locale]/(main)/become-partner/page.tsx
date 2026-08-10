"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslation } from "@/lib/i18n/context"
import { createClient } from "@/utils/supabase/client"
import { getMySupplierMemberships, submitSupplierApplication } from "@/lib/api/suppliers"
import type { SupplierStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner"
import { Building2, Clock, CheckCircle2, XCircle, LogIn, Loader2 } from "lucide-react"

type ApplyState =
  | { kind: "loading" }
  | { kind: "guest" }
  | { kind: "form" }
  | { kind: "status"; status: SupplierStatus; displayName: string; note: string | null }

const buildApplicationSchema = (msg: { required: string; phone: string; email: string }) =>
  z.object({
    legalName: z.string().trim().min(2, msg.required).max(160),
    displayName: z.string().trim().min(2, msg.required).max(120),
    businessPhone: z.string().trim().regex(/^(0|\+84)\d{8,10}$/, msg.phone),
    businessEmail: z.string().trim().email(msg.email).max(160).or(z.literal("")),
    taxCode: z.string().trim().max(40).optional(),
    onboardingNote: z.string().trim().max(1000).optional(),
  })

type ApplicationValues = z.infer<ReturnType<typeof buildApplicationSchema>>

export default function BecomePartnerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const { t } = useTranslation()
  const supabase = createClient()

  const [state, setState] = useState<ApplyState>({ kind: "loading" })
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<ApplicationValues>({
    resolver: zodResolver(buildApplicationSchema({
      required: t("partnerApply.errorRequired"),
      phone: t("partnerApply.errorPhone"),
      email: t("partnerApply.errorEmail"),
    })),
    defaultValues: {
      legalName: "",
      displayName: "",
      businessPhone: "",
      businessEmail: "",
      taxCode: "",
      onboardingNote: "",
    },
  })

  useEffect(() => {
    let active = true
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!active) return
      if (!user) {
        setState({ kind: "guest" })
        return
      }

      try {
        const memberships = await getMySupplierMemberships()
        if (!active) return
        if (memberships.length > 0) {
          const s = memberships[0].supplier
          setState({ kind: "status", status: s.status, displayName: s.displayName, note: s.onboardingNote })
          return
        }
      } catch {
        // Backend unreachable or no membership — fall through to the form
      }

      // Prefill contact info from the profile so the owner only adds business details
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, email")
        .eq("id", user.id)
        .single()
      if (!active) return
      form.reset({
        legalName: profile?.full_name ?? "",
        displayName: "",
        businessPhone: profile?.phone ?? "",
        businessEmail: profile?.email ?? user.email ?? "",
        taxCode: "",
        onboardingNote: "",
      })
      setState({ kind: "form" })
    }
    load()
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (values: ApplicationValues) => {
    setSubmitting(true)
    try {
      const supplier = await submitSupplierApplication({
        legalName: values.legalName,
        displayName: values.displayName,
        businessPhone: values.businessPhone,
        businessEmail: values.businessEmail || undefined,
        taxCode: values.taxCode || undefined,
        onboardingNote: values.onboardingNote || undefined,
      })
      toast.success(t("partnerApply.successTitle"))
      setState({ kind: "status", status: supplier.status, displayName: supplier.displayName, note: null })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("partnerApply.submitError"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:py-14">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Building2 className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("partnerApply.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("partnerApply.subtitle")}</p>
      </div>

      {state.kind === "loading" && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {state.kind === "guest" && (
        <Card className="rounded-2xl p-8 text-center">
          <LogIn className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">{t("partnerApply.loginPrompt")}</p>
          <Link href={`/${locale}/login?redirect=/${locale}/become-partner`}>
            <Button className="mt-6 rounded-xl">{t("partnerApply.loginCta")}</Button>
          </Link>
        </Card>
      )}

      {state.kind === "status" && (
        <Card className="rounded-2xl p-8 text-center">
          {state.status === "pending" && (
            <>
              <Clock className="mx-auto h-10 w-10 text-amber-500" />
              <h2 className="mt-4 text-xl font-semibold text-foreground">{t("partnerApply.pendingTitle")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("partnerApply.pendingBody")}</p>
              <p className="mt-4 text-sm font-medium text-foreground">{state.displayName}</p>
            </>
          )}
          {state.status === "approved" && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
              <h2 className="mt-4 text-xl font-semibold text-foreground">{t("partnerApply.approvedTitle")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("partnerApply.approvedBody")}</p>
              <Link href={`/${locale}/partner`}>
                <Button className="mt-6 rounded-xl">{t("partnerApply.approvedCta")}</Button>
              </Link>
            </>
          )}
          {(state.status === "rejected" || state.status === "suspended") && (
            <>
              <XCircle className="mx-auto h-10 w-10 text-destructive" />
              <h2 className="mt-4 text-xl font-semibold text-foreground">{t("partnerApply.rejectedTitle")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("partnerApply.rejectedBody")}</p>
              {state.note && <p className="mt-4 rounded-xl bg-muted p-3 text-sm text-muted-foreground">{state.note}</p>}
            </>
          )}
        </Card>
      )}

      {state.kind === "form" && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">{t("partnerApply.formTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
                <FormField
                  control={form.control}
                  name="legalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("partnerApply.legalName")} *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("partnerApply.legalNamePlaceholder")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("partnerApply.displayName")} *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("partnerApply.displayNamePlaceholder")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="businessPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("partnerApply.businessPhone")} *</FormLabel>
                        <FormControl>
                          <Input {...field} inputMode="tel" placeholder="0901234567" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="businessEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("partnerApply.businessEmail")}</FormLabel>
                        <FormControl>
                          <Input {...field} inputMode="email" placeholder="business@example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="taxCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("partnerApply.taxCode")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("partnerApply.taxCodePlaceholder")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="onboardingNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("partnerApply.note")}</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} placeholder={t("partnerApply.notePlaceholder")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="lg" className="mt-1 rounded-xl" disabled={submitting}>
                  {submitting ? t("partnerApply.submitting") : t("partnerApply.submit")}
                </Button>
                <p className="text-center text-xs text-muted-foreground">{t("partnerApply.reviewHint")}</p>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

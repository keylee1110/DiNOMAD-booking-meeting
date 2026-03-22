"use client"

import { useTranslation } from "@/lib/i18n/context"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface GuestInfoFormProps {
  fullName: string
  setFullName: (v: string) => void
  phone: string
  setPhone: (v: string) => void
  email: string
  setEmail: (v: string) => void
  agreeTerms: boolean
  setAgreeTerms: (v: boolean) => void
  errors: Partial<Record<"fullName" | "phone" | "email" | "agreeTerms", string>>
  onProceed: () => void
  canProceed: boolean
  isPaying: boolean
  locale: string
}

export function GuestInfoForm({
  fullName,
  setFullName,
  phone,
  setPhone,
  email,
  setEmail,
  agreeTerms,
  setAgreeTerms,
  errors,
  onProceed,
  canProceed,
  isPaying,
  locale
}: GuestInfoFormProps) {
  const { t } = useTranslation()

  return (
    <Card className="p-5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t("checkout.yourDetails")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">{t("checkout.fullName")}</Label>
          <Input
            id="fullName"
            placeholder={t("checkout.namePlaceholder")}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={cn(errors.fullName ? "border-destructive" : "")}
            autoComplete="name"
          />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t("checkout.phone")}</Label>
          <Input
            id="phone"
            placeholder={t("checkout.phonePlaceholder")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={cn(errors.phone ? "border-destructive" : "")}
            inputMode="tel"
            autoComplete="tel"
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("checkout.email")}</Label>
          <Input
            id="email"
            placeholder={t("checkout.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(errors.email ? "border-destructive" : "")}
            inputMode="email"
            autoComplete="email"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <Separator />

        <div className="flex items-start gap-3">
          <Checkbox 
            checked={agreeTerms} 
            onCheckedChange={(v) => setAgreeTerms(Boolean(v))} 
            className={cn(errors.agreeTerms ? "border-destructive" : "")}
          />
          <div className="space-y-1">
            <p className={cn("text-sm font-medium", errors.agreeTerms ? "text-destructive" : "")}>
              {t("checkout.termsAgree")}
            </p>
            <p className="text-xs text-muted-foreground">
              {locale === "vi"
                ? "Bạn sẽ không được đổi lịch sau khi thanh toán thành công."
                : "You can’t change the booking after successful payment."}
            </p>
            {errors.agreeTerms && (
              <p className="text-xs font-semibold text-destructive mt-1">{errors.agreeTerms}</p>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          className="w-full rounded-none lg:hidden"
          size="lg"
          onClick={onProceed}
          disabled={!canProceed}
        >
          {isPaying ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("payment.waitingPayment")}
            </span>
          ) : (
            t("checkout.proceedPayment")
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

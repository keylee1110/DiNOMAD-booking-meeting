"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { Building2, Loader2 } from "lucide-react"
import { getSuppliers, approveSupplier } from "@/lib/api/admin"
import type { Supplier } from "@/lib/types"
import { toast } from "sonner"
import Link from "next/link"

export function PendingSuppliers() {
  const { t, locale } = useTranslation()
  const [pending, setPending] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getSuppliers()
      setPending(data.filter((s) => s.status === "pending"))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleApprove = async (supplier: Supplier) => {
    setActionId(supplier.id)
    try {
      await approveSupplier(supplier.id)
      toast.success(`${supplier.displayName} ${locale === "vi" ? "đã được duyệt!" : "approved!"}`)
      load()
    } catch {
      toast.error(t("admin.suppliers.actions.error"))
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-foreground">{t("admin.suppliers.widget.title")}</h2>
        <span className="text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full">
          {pending.length} {locale === "vi" ? "đang chờ" : "awaiting"}
        </span>
      </div>
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : pending.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{t("admin.suppliers.noPending")}</p>
        ) : (
          pending.slice(0, 5).map((supplier) => (
            <div key={supplier.id} className="p-3 bg-muted/50 rounded-lg border border-border hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{supplier.displayName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {supplier.legalName}{supplier.businessPhone ? ` · ${supplier.businessPhone}` : ""}
                  </p>
                </div>
                <Building2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleApprove(supplier)}
                  disabled={actionId === supplier.id}
                  className="flex-1 text-xs font-medium py-1.5 px-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {actionId === supplier.id ? (
                    <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                  ) : (
                    t("admin.suppliers.actions.approve")
                  )}
                </button>
                <Link
                  href={`/${locale}/admin/suppliers`}
                  className="flex-1 text-xs font-medium py-1.5 px-3 border border-border text-muted-foreground rounded-md hover:text-foreground hover:bg-background transition-all text-center"
                >
                  {t("admin.suppliers.actions.view")}
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

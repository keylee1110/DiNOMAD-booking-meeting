"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslation } from "@/lib/i18n/context"
import { Building2, CheckCircle2, Clock, Search, XCircle, Loader2, AlertTriangle } from "lucide-react"
import { getSuppliers, approveSupplier, rejectSupplier } from "@/lib/api/admin"
import type { Supplier } from "@/lib/types"
import { toast } from "sonner"

type FilterTab = "all" | "pending" | "approved" | "rejected"

export default function AdminSuppliersPage() {
  const { t, locale } = useTranslation()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterTab, setFilterTab] = useState<FilterTab>("all")

  const loadSuppliers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getSuppliers()
      setSuppliers(data)
    } catch (err) {
      toast.error(t("admin.suppliers.actions.error"))
    } finally {
      setLoading(false)
    }
  }, [t])


  useEffect(() => {
    loadSuppliers()
  }, [loadSuppliers])

  const filtered = suppliers.filter((s) => {
    if (filterTab !== "all" && s.status !== filterTab) return false
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.displayName.toLowerCase().includes(q) ||
      s.legalName.toLowerCase().includes(q) ||
      (s.businessEmail ?? "").toLowerCase().includes(q) ||
      (s.businessPhone ?? "").includes(q)
    )
  })

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: locale === "vi" ? "Tất cả" : "All", count: suppliers.length },
    { key: "pending", label: t("admin.suppliers.pending"), count: suppliers.filter((s) => s.status === "pending").length },
    { key: "approved", label: t("admin.suppliers.approved"), count: suppliers.filter((s) => s.status === "approved").length },
    { key: "rejected", label: t("admin.suppliers.rejected"), count: suppliers.filter((s) => s.status === "rejected").length },
  ]

  const handleApprove = async (supplier: Supplier) => {
    try {
      await approveSupplier(supplier.id)
      toast.success(`${supplier.displayName} ${locale === "vi" ? "đã được duyệt!" : "approved!"}`)
      loadSuppliers()
    } catch {
      toast.error(t("admin.suppliers.actions.error"))
    }
  }

  const handleReject = async (supplier: Supplier) => {
    try {
      await rejectSupplier(supplier.id)
      toast.success(`${supplier.displayName} ${locale === "vi" ? "đã bị từ chối." : "rejected."}`)
      loadSuppliers()
    } catch {
      toast.error(t("admin.suppliers.actions.error"))
    }
  }

  const statusBadge = (status: Supplier["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-emerald-700 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            {t("admin.suppliers.statusLabels.approved")}
          </span>
        )
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-amber-700 bg-amber-100 dark:bg-amber-500/15 dark:text-amber-400">
            <Clock className="w-3 h-3" />
            {t("admin.suppliers.statusLabels.pending")}
          </span>
        )
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-red-700 bg-red-100 dark:bg-red-500/15 dark:text-red-400">
            <XCircle className="w-3 h-3" />
            {t("admin.suppliers.statusLabels.rejected")}
          </span>
        )
      case "suspended":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-gray-700 bg-gray-100 dark:bg-gray-500/15 dark:text-gray-400">
            <AlertTriangle className="w-3 h-3" />
            {t("admin.suppliers.statusLabels.suspended")}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("admin.suppliers.title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{suppliers.length} {t("admin.suppliers.total")}</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              filterTab === tab.key
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.key !== "all" && (
              <span className="ml-1.5 text-xs text-muted-foreground">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.suppliers.search")}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted border border-border rounded-md outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Supplier List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {search ? t("common.noResults") : t("admin.suppliers.empty")}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">{locale === "vi" ? "Tên" : "Name"}</th>
                <th className="text-center px-5 py-3 font-semibold text-muted-foreground">{locale === "vi" ? "Trạng thái" : "Status"}</th>
                <th className="text-right px-5 py-3 font-semibold text-muted-foreground">{locale === "vi" ? "Thao tác" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-muted/30 transition-colors">
                  {/* Name */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{supplier.displayName}</div>
                        <div className="text-xs text-muted-foreground">
                          {supplier.businessEmail ?? supplier.legalName}
                          {supplier.businessPhone && ` · ${supplier.businessPhone}`}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status — center */}
                  <td className="px-5 py-4 text-center">{statusBadge(supplier.status)}</td>

                  {/* Actions — right */}
                  <td className="px-5 py-4 text-right">
                    {supplier.status === "pending" ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleReject(supplier)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/25 transition-colors"
                        >
                          {locale === "vi" ? "Từ chối" : "Reject"}
                        </button>
                        <button
                          onClick={() => handleApprove(supplier)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                        >
                          {locale === "vi" ? "Duyệt" : "Approve"}
                        </button>
                      </div>
                    ) : supplier.status === "approved" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {locale === "vi" ? "Đã duyệt" : "Approved"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg">
                        <XCircle className="w-3.5 h-3.5" />
                        {locale === "vi" ? "Đã từ chối" : "Rejected"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

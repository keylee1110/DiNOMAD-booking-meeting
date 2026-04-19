import { Building2 } from "lucide-react"

const pendingSuppliers = [
  { name: "Huong Giang Workspace", district: "District 3", contact: "Ms. Giang", rooms: 3 },
  { name: "Tech Hub BThanh", district: "Binh Thanh", contact: "Mr. Duc", rooms: 5 },
]

export function PendingSuppliers() {
  return (
    <div className="flex flex-col">
      <div className="px-6 py-5 border-b border-white/40 dark:border-white/10 flex items-center justify-between bg-white/40 dark:bg-muted/10">
        <h2 className="font-bold text-foreground text-lg tracking-tight">Pending Suppliers</h2>
        <span className="text-xs font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-md shadow-sm">
          {pendingSuppliers.length} awaiting
        </span>
      </div>
      <div className="p-6 space-y-4">
        {pendingSuppliers.map((supplier) => (
          <div key={supplier.name} className="p-4 bg-white/50 dark:bg-muted/30 rounded-xl border border-white/60 dark:border-white/10 shadow-sm hover:border-primary/30 transition-colors group">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">{supplier.name}</p>
                <p className="text-xs font-medium text-muted-foreground mt-1">
                  {supplier.district} · {supplier.contact} · {supplier.rooms} rooms
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button className="flex-1 text-xs font-bold py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:shadow-md hover:-translate-y-0.5 transition-all outline-none focus:ring-2 focus:ring-primary/20">
                Approve
              </button>
              <button className="flex-1 text-xs font-bold py-2 px-4 bg-white dark:bg-muted text-foreground rounded-lg border border-border/60 hover:bg-muted/50 transition-all outline-none">
                Review
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

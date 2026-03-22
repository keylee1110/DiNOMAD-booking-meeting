import { Building2 } from "lucide-react"

const pendingSuppliers = [
  { name: "Huong Giang Workspace", district: "District 3", contact: "Ms. Giang", rooms: 3 },
  { name: "Tech Hub BThanh", district: "Binh Thanh", contact: "Mr. Duc", rooms: 5 },
]

export function PendingSuppliers() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Pending Suppliers</h2>
        <span className="text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full">
          {pendingSuppliers.length} awaiting
        </span>
      </div>
      <div className="p-4 space-y-3">
        {pendingSuppliers.map((supplier) => (
          <div key={supplier.name} className="p-3 bg-muted/50 rounded-lg border border-border hover:border-primary/20 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{supplier.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {supplier.district} · {supplier.contact} · {supplier.rooms} rooms
                </p>
              </div>
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            </div>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 text-xs font-medium py-1.5 px-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
                Approve
              </button>
              <button className="flex-1 text-xs font-medium py-1.5 px-3 border border-border text-muted-foreground rounded-md hover:text-foreground hover:bg-background transition-all">
                Review
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

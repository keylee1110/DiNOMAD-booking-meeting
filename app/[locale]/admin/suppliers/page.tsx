import { Building2, CheckCircle2, Clock, Search, Plus } from "lucide-react"

const mockSuppliers = [
  { id: "S-001", name: "The Coffee Lab", contact: "Mr. Thanh", email: "thanh@coffeelab.vn", phone: "0287654321", district: "Thu Duc", rooms: 2, joined: "2025-08-01", status: "approved" },
  { id: "S-002", name: "Nomad Hub D10", contact: "Ms. Lan", email: "lan@nomadhub.vn", phone: "0288765432", district: "District 10", rooms: 2, joined: "2025-09-15", status: "approved" },
  { id: "S-003", name: "Workspace Saigon", contact: "Mr. Khoa", email: "khoa@workspace.vn", phone: "0289876543", district: "District 7", rooms: 2, joined: "2025-10-20", status: "approved" },
  { id: "S-004", name: "BookCafe Central", contact: "Ms. Hoa", email: "hoa@bookcafe.vn", phone: "0280987654", district: "District 1", rooms: 2, joined: "2025-11-05", status: "approved" },
  { id: "S-005", name: "CoStudy BT", contact: "Mr. Duc", email: "duc@costudy.vn", phone: "0281098765", district: "Binh Thanh", rooms: 2, joined: "2025-12-01", status: "approved" },
  { id: "S-006", name: "Huong Giang Workspace", contact: "Ms. Giang", email: "giang@huonggiang.vn", phone: "0282109876", district: "District 3", rooms: 3, joined: "2026-03-10", status: "pending" },
  { id: "S-007", name: "Tech Hub BThanh", contact: "Mr. Minh", email: "minh@techhub.vn", phone: "0283210987", district: "Binh Thanh", rooms: 5, joined: "2026-03-18", status: "pending" },
]

export default function AdminSuppliersPage() {
  const approved = mockSuppliers.filter((s) => s.status === "approved").length
  const pending = mockSuppliers.filter((s) => s.status === "pending").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{mockSuppliers.length} total suppliers</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity shrink-0">
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{approved}</p>
          <p className="text-xs text-muted-foreground mt-1">Approved</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pending}</p>
          <p className="text-xs text-muted-foreground mt-1">Pending Review</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search suppliers..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted border border-border rounded-md outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Supplier</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Contact</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">District</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Rooms</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockSuppliers.map((supplier, i) => (
                <tr key={supplier.id} className={i < mockSuppliers.length - 1 ? "border-b border-border hover:bg-muted/30 transition-colors" : "hover:bg-muted/30 transition-colors"}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{supplier.name}</div>
                        <div className="text-xs text-muted-foreground">{supplier.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">
                    <div>{supplier.contact}</div>
                    <div className="text-xs">{supplier.phone}</div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground hidden lg:table-cell">{supplier.district}</td>
                  <td className="px-5 py-4 font-medium text-foreground hidden sm:table-cell">{supplier.rooms}</td>
                  <td className="px-5 py-4">
                    {supplier.status === "approved" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {supplier.status === "pending" && (
                        <button className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">Approve</button>
                      )}
                      <button className="text-xs font-medium text-primary hover:underline">View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

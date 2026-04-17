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

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 transition-transform">
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{approved}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Approved</p>
        </div>
        <div className="bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-6 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 transition-transform">
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">{pending}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Pending Review</p>
        </div>
      </div>

      <div className="bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-sm">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search suppliers by name or email..."
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-white/50 dark:bg-muted/30 border border-white/60 dark:border-border/50 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-foreground placeholder:text-muted-foreground transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/40 dark:border-white/10 bg-muted/20">
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Supplier</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">District</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Rooms</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40 dark:divide-white/10">
              {mockSuppliers.map((supplier, i) => (
                <tr key={supplier.id} className="hover:bg-white/40 dark:hover:bg-muted/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-sm">
                        <Building2 className="w-4.5 h-4.5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{supplier.name}</div>
                        <div className="text-xs font-medium text-muted-foreground mt-0.5">{supplier.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-muted-foreground hidden md:table-cell">
                    <div>{supplier.contact}</div>
                    <div className="text-xs">{supplier.phone}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-muted-foreground hidden lg:table-cell">{supplier.district}</td>
                  <td className="px-6 py-4 font-semibold text-foreground hidden sm:table-cell">{supplier.rooms}</td>
                  <td className="px-6 py-4">
                    {supplier.status === "approved" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm border border-black/5 text-emerald-700 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm border border-black/5 text-amber-700 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400">
                        <Clock className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {supplier.status === "pending" && (
                        <button className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors">Approve</button>
                      )}
                      <button className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">View</button>
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

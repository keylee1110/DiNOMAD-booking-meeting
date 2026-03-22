import { StatsGrid } from "./_components/stats-grid"
import { RecentBookings } from "./_components/recent-bookings"
import { PendingSuppliers } from "./_components/pending-suppliers"
import { RoomStatusOverview } from "./_components/room-status-overview"

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Welcome back, Admin. Here's what's happening today.
        </p>
      </div>

      {/* Stats Section */}
      <StatsGrid />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Main Activity */}
        <div className="xl:col-span-2 space-y-6">
          <RecentBookings />
        </div>

        {/* Right Column: Secondary Info */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <PendingSuppliers />
            <RoomStatusOverview />
          </div>
        </div>
      </div>
    </div>
  )
}

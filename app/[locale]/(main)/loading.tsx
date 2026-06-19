export default function Loading() {
  return (
    <div className="flex flex-col bg-gradient-to-b from-primary/5 via-background to-background animate-pulse">
      {/* Hero skeleton */}
      <section className="relative overflow-hidden pt-16 pb-12 md:pt-24 md:pb-20">
        <div className="mx-auto flex max-w-7xl flex-col px-4 md:flex-row md:items-start md:gap-12">
          {/* Left: Typography skeleton */}
          <div className="z-10 flex-1 md:pr-12 flex flex-col gap-8">
            <div className="space-y-4">
              <div className="h-16 w-3/4 rounded-xl bg-muted/60" />
              <div className="h-10 w-1/2 rounded-xl bg-muted/40" />
              <div className="h-5 w-full max-w-lg rounded-lg bg-muted/40" />
              <div className="h-5 w-4/5 max-w-lg rounded-lg bg-muted/30" />
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-muted/40 border border-border/30" />
              ))}
            </div>

            <div className="flex items-center gap-8 border-t border-border/40 pt-6 max-w-md">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 w-16 rounded-lg bg-muted/40" />
              ))}
            </div>
          </div>

          {/* Right: Search box skeleton */}
          <div className="z-10 mt-12 w-full md:mt-0 md:w-[400px] lg:w-[450px] shrink-0">
            <div className="flex flex-col gap-4 border border-border/50 bg-card p-6 rounded-2xl shadow-sm">
              <div className="h-5 w-24 rounded-lg bg-muted/60" />
              <div className="h-10 w-full rounded-xl bg-muted/40" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 rounded-xl bg-muted/40" />
                <div className="h-10 rounded-xl bg-muted/40" />
              </div>
              <div className="h-11 w-full rounded-xl bg-primary/20" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms skeleton */}
      <section className="border-b border-border/40 py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 w-48 rounded-lg bg-muted/60" />
              <div className="h-4 w-64 rounded-lg bg-muted/40" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-28 rounded-xl bg-muted/40" />
              <div className="h-9 w-28 rounded-xl bg-muted/30" />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-border/40 bg-card">
                <div className="aspect-[4/3] bg-muted/50" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-3/4 rounded-lg bg-muted/60" />
                  <div className="h-4 w-1/2 rounded-lg bg-muted/40" />
                  <div className="h-4 w-2/3 rounded-lg bg-muted/30" />
                  <div className="h-8 w-full rounded-lg bg-muted/30 mt-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

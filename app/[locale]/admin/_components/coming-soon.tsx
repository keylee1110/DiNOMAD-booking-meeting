import { Construction, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ComingSoonProps {
  title: string
  description?: string
  locale: string
}

export function ComingSoon({ title, description, locale }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-white/60 dark:bg-card/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="w-20 h-20 rounded-2xl bg-white/40 dark:bg-primary/5 flex items-center justify-center mb-6 shadow-inner border border-white/60 dark:border-white/5">
        <Construction className="w-10 h-10 text-primary drop-shadow-sm" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        {description || "Tính năng này đang được phát triển. Vui lòng quay lại sau."}
      </p>
      <Link 
        href={`/${locale}/admin`}
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại Dashboard
      </Link>
    </div>
  )
}

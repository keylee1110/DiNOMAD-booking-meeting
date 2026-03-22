import { Construction, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ComingSoonProps {
  title: string
  description?: string
  locale: string
}

export function ComingSoon({ title, description, locale }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-card border border-dashed border-border rounded-xl">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Construction className="w-8 h-8 text-primary" />
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

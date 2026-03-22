import { ComingSoon } from "../_components/coming-soon"

export default async function AdminAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics & Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Theo dõi hiệu suất kinh doanh và hành vi người dùng.
        </p>
      </div>

      <ComingSoon 
        title="Module Analytics đang được phát triển" 
        description="Chúng tôi đang xây dựng hệ thống báo cáo chi tiết về doanh thu, lượt đặt phòng và tăng trưởng người dùng. Tính năng này sẽ sớm ra mắt."
        locale={locale}
      />
    </div>
  )
}

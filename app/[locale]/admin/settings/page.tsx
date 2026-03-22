import { ComingSoon } from "../_components/coming-soon"

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Cấu hình hệ thống, quản lý thông tin bảo mật và cài đặt nền tảng.
        </p>
      </div>

      <ComingSoon 
        title="Admin Settings Coming Soon" 
        description="Chúng tôi đang phát triển các tính năng cài đặt chuyên sâu cho Admin để quản trị hệ thống linh hoạt hơn."
        locale={locale}
      />
    </div>
  )
}

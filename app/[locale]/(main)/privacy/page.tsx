import Link from "next/link"
import { Shield, Mail, Trash2, ArrowLeft } from "lucide-react"

interface Props {
  params: Promise<{ locale: string }>
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params
  const isVi = locale === "vi"

  return (
    <div className="min-h-screen bg-background/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-card border border-border/80 shadow-sm rounded-3xl p-6 md:p-10 relative overflow-hidden">
        {/* Decorative background gradient */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(30rem_15rem_at_90%_5rem,rgba(59,130,246,0.06),transparent)] pointer-events-none" />
        
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span>{isVi ? "Quay lại trang chủ" : "Back to Home"}</span>
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-inner">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              {isVi ? "Chính Sách Bảo Mật" : "Privacy Policy"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {isVi ? "Cập nhật lần cuối: 29 tháng 06, 2026" : "Last updated: June 29, 2026"}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8 text-foreground/90 text-sm md:text-base leading-relaxed font-sans">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-extrabold">1.</span>
              {isVi ? "Thông tin chúng tôi thu thập" : "Information We Collect"}
            </h2>
            <p>
              {isVi 
                ? "Chúng tôi thu thập thông tin để cung cấp dịch vụ đặt phòng họp tốt hơn cho người dùng. Các thông tin bao gồm:"
                : "We collect information to provide better meeting room booking services. This includes:"}
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>
                <strong>{isVi ? "Thông tin tài khoản:" : "Account Information:"}</strong>{" "}
                {isVi 
                  ? "Họ tên, địa chỉ email, số điện thoại khi bạn đăng ký thủ công."
                  : "Full name, email address, phone number when you register manually."}
              </li>
              <li>
                <strong>{isVi ? "Thông tin từ bên thứ ba (OAuth):" : "Third-Party Authentications (OAuth):"}</strong>{" "}
                {isVi 
                  ? "Khi bạn đăng nhập bằng Google hoặc Facebook, chúng tôi nhận được họ tên, địa chỉ email và ảnh đại diện công khai (avatar) của bạn từ nhà cung cấp dịch vụ để khởi tạo hồ sơ."
                  : "When you log in with Google or Facebook, we receive your name, email, and public profile picture (avatar) from the provider to initialize your profile."}
              </li>
              <li>
                <strong>{isVi ? "Dữ liệu đặt phòng:" : "Booking Data:"}</strong>{" "}
                {isVi 
                  ? "Lịch sử đặt chỗ, không gian đã chọn, số tiền thanh toán và thời gian sử dụng dịch vụ."
                  : "Booking history, spaces selected, amounts paid, and service usage times."}
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-extrabold">2.</span>
              {isVi ? "Cách chúng tôi sử dụng thông tin" : "How We Use Information"}
            </h2>
            <p>
              {isVi 
                ? "Thông tin được sử dụng cho các mục đích chính đáng sau:"
                : "Information is used for the following legitimate purposes:"}
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
              <li>{isVi ? "Xác minh tài khoản và xử lý việc đặt chỗ tại các địa điểm đối tác." : "Verifying your account and processing bookings at partner venues."}</li>
              <li>{isVi ? "Gửi email xác nhận đặt phòng, hóa đơn và thông báo cập nhật trạng thái." : "Sending booking confirmations, invoices, and status notifications."}</li>
              <li>{isVi ? "Hỗ trợ khách hàng và giải quyết các khiếu nại, sự cố." : "Providing customer support and resolving complaints or issues."}</li>
              <li>{isVi ? "Đảm bảo an ninh hệ thống và ngăn ngừa các hành vi gian lận thanh toán." : "Ensuring system security and preventing payment fraudulent activities."}</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-extrabold">3.</span>
              {isVi ? "Thời gian lưu trữ thông tin" : "Data Retention Period"}
            </h2>
            <p>
              {isVi
                ? "Chúng tôi lưu trữ thông tin cá nhân của bạn cho đến khi tài khoản bị xóa hoặc khi thông tin đó không còn cần thiết cho việc cung cấp dịch vụ đặt chỗ."
                : "We retain your personal information for as long as your account exists or as required to provide booking services."}
            </p>
          </section>

          {/* Section 4 (Data Deletion Anchor for Facebook) */}
          <section id="data-deletion" className="space-y-4 p-5 md:p-6 rounded-2xl bg-destructive/5 border border-destructive/10 scroll-mt-20">
            <h2 className="text-lg md:text-xl font-bold text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5 shrink-0" />
              {isVi ? "Yêu cầu xóa dữ liệu (Data Deletion Instructions)" : "User Data Deletion Instructions"}
            </h2>
            <p className="text-muted-foreground">
              {isVi 
                ? "Chúng tôi tôn trọng quyền kiểm soát thông tin cá nhân của bạn. Nếu bạn muốn xóa tài khoản hoặc thu hồi kết nối với tài khoản mạng xã hội (Google, Facebook) của mình trên hệ thống DiNOMAD, hãy thực hiện theo hướng dẫn sau:"
                : "We respect your control over your personal data. If you wish to delete your account or revoke social media connections (Google, Facebook) on DiNOMAD, please follow these instructions:"}
            </p>
            <div className="space-y-3 pl-2 text-foreground/80 font-medium">
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive text-xs font-bold mt-0.5">1</span>
                <p>
                  {isVi 
                    ? "Gửi email yêu cầu xóa dữ liệu của bạn tới địa chỉ: " 
                    : "Send a data deletion request email to: "}
                  <a href="mailto:admin@dinomad.vn" className="text-primary hover:underline font-bold">admin@dinomad.vn</a>
                  {" "}{isVi ? "hoặc" : "or"}{" "}
                  <a href="mailto:contact@dinomad.vn" className="text-primary hover:underline font-bold">contact@dinomad.vn</a>.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive text-xs font-bold mt-0.5">2</span>
                <p>
                  {isVi 
                    ? "Trong email, vui lòng cung cấp địa chỉ Email đăng ký tài khoản hoặc email liên kết với Google/Facebook mà bạn muốn xóa."
                    : "In your email, please provide the registered account email or the social email link you wish to remove."}
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive text-xs font-bold mt-0.5">3</span>
                <p>
                  {isVi 
                    ? "Bộ phận quản trị của chúng tôi sẽ xử lý yêu cầu của bạn, xóa bỏ toàn bộ thông tin tài khoản, thông tin đặt phòng liên quan và phản hồi xác nhận cho bạn trong vòng 48 giờ làm việc."
                    : "Our admin team will process your request, delete all profile details and related bookings, and reply with confirmation within 48 business hours."}
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-primary font-extrabold">4.</span>
              {isVi ? "Liên hệ với chúng tôi" : "Contact Information"}
            </h2>
            <p>
              {isVi 
                ? "Nếu bạn có bất kỳ câu hỏi nào về chính sách này hoặc bảo mật thông tin, xin vui lòng liên hệ:"
                : "If you have any questions about this policy or security matters, please reach out to:"}
            </p>
            <div className="flex flex-col gap-2 pl-2 text-muted-foreground">
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>admin@dinomad.vn / contact@dinomad.vn</span>
              </span>
              <span>DiNOMAD Team - 2026.</span>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

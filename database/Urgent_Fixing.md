## **Fix 1 — Auth / Register / Profile / Role**

**Phạm vi:** login, register, verify email, profile, logout, role.

| Task | Cần làm |
| ----- | ----- |
| ~~Social login~~ | ✅ Done — `signInWithOAuth` wired ở cả login/signup, `app/api/auth/callback/route.ts` xử lý code exchange + role redirect. File: `app/[locale]/login/page.tsx:188-214`, `app/[locale]/signup/page.tsx:190-213`. Chỉ còn phụ thuộc config Google/Facebook client ID trên Supabase dashboard (ngoài repo). |
| ~~Login validation~~ | ✅ Done — kèm theo trong đợt merge auth mới, toast lỗi + validate email/password đã có ở `login/page.tsx`. |
| ~~Register validation~~ | ✅ Done — full name, SĐT (regex VN), email, password ≥6 ký tự, confirm password, checkbox điều khoản đều có toast lỗi riêng. File: `app/[locale]/signup/page.tsx:38-102`. |
| ~~Register social~~ | ✅ Done — cùng cơ chế OAuth với login, xem `signup/page.tsx:190-213`. |
| Verify email | Chưa xác nhận lại — cần test thủ công flow "chưa verify thì không login được" có thông báo rõ hay không. |
| Profile | Chưa xác nhận lại — cần test avatar load + toast update profile. |
| ~~Role login~~ | ✅ Done — sau khi `signInWithPassword`, code fetch role thật từ `profiles` và enforce 2 chiều (chọn admin nhưng role thật không phải admin → signOut + toast, tương tự supplier/customer). File: `app/[locale]/login/page.tsx:62-152`. Nút "Demo Admin Access" (dead UI) đã được gỡ khỏi trang login. |
| ~~Logout~~ | ✅ Done — `handleLogout` await `supabase.auth.signOut()` đúng, wired vào onClick. File: `app/[locale]/admin/_components/admin-sidebar.tsx:62-69,121`. |
| Forgot password | Có thể làm optional nếu còn thời gian. |

**Người phụ trách:** Dev Auth / Backend-integrated Frontend.

**Ưu tiên:** Cao nhất, vì không login/register ổn thì các flow sau khó test.

---

## **Fix 2 — Booking / Order / Room / Supplier / Manager Logic**

**Phạm vi:** đặt phòng, đơn đặt, QR, slot, rating, API CRUD.

| Task | Cần làm |
| ----- | ----- |
| ~~Rating room card~~ | ✅ Done — root cause: `mapPublicRoom()` (`lib/data/public-room.ts`) hardcode `rating: 0, reviewCount: 0` cho mọi room, dùng chung bởi cả search/card path lẫn detail path — không hề query bảng `reviews`. Đã thêm `reviews(rating)` vào `PUBLIC_ROOM_SELECT` (`lib/api/public-rooms.ts`) và tính trung bình thật trong `mapPublicRoom()`. RLS `reviews` đã cho phép `anon` select nên không cần đổi policy. File: `lib/data/public-room.ts`, `lib/api/public-rooms.ts`. |
| ~~District/address~~ | ✅ Done — thêm `formatDistrict(district, locale)` vào `lib/format.ts`: UI tiếng Việt giờ hiện "Quận 9", "Hóc Môn", "Quận 3"… (map từ giá trị tiếng Anh trong DB), UI tiếng Anh giữ "District 9". Chỉ format lúc hiển thị, KHÔNG đổi giá trị lưu trong DB nên filter theo district vẫn chạy. Áp dụng ở: room card, trang chi tiết phòng, checkout summary, confirmation view. **Lưu ý quan trọng**: không thể localize tên phòng/địa chỉ đầy đủ vì migration `20260608143000_remove_vi_columns.sql` đã XÓA toàn bộ cột `*_vi` khỏi DB (dữ liệu 1 ngôn ngữ duy nhất). Tiện thể sửa luôn bug: `PublicRoomsService` (backend) vẫn select `name_vi/address_vi` đã bị xóa → `GET /api/rooms` và `GET /api/rooms/:id` bị 500 — đã gỡ các cột chết, endpoint trả 200. |
| ~~Split payment~~ | ✅ Done — ô "Chia tiền" giờ là input số gõ trực tiếp (clamp 2–50), vẫn giữ nút +/−. Đồng thời bỏ dòng auto-set số người = sức chứa phòng (nguyên nhân "bấm trừ từ 30 người") — mặc định giờ là 2. File: `app/[locale]/(main)/rooms/[id]/page.tsx`. |
| ~~Order status~~ | ✅ Done — nút "Xem mã QR" trong my-bookings giờ ẩn với đơn pending/cancelled. Quan trọng hơn: trang `checkout/success` (nơi thực sự hiện QR/mã check-in) trước đây hiện mã bất kể status — đã thêm chặn cứng tại đó nên dù vào bằng cách nào (link, gõ URL trực tiếp) cũng không lộ mã cho đơn chưa trả tiền/đã hủy. File: `app/[locale]/(main)/checkout/success/page.tsx`, `app/[locale]/(main)/my-bookings/page.tsx`. |
| ~~Back to homepage~~ | ✅ Done — 2 nguyên nhân: (1) trang `checkout/success?id=...` (mở từ "Xem mã QR" / reload / share link) redirect về homepage vì danh sách đơn chưa load xong mà code coi "chưa tìm thấy" = "không tồn tại" → đã thêm cờ `bookingsLoaded` vào booking store và chỉ redirect sau khi load xong; (2) tên phòng trên card đơn đặt giờ là link về trang detail phòng. File: `app/[locale]/(main)/checkout/success/page.tsx`, `app/[locale]/(main)/my-bookings/page.tsx`, `lib/store/booking-store.tsx`. |
| ~~Reload orders~~ | ✅ Done — nút "Làm mới" vốn có gọi lại Supabase nhưng không await, không có feedback nên tưởng không chạy. Giờ await thật sự, hiện spinner khi đang chạy, toast "Đã cập nhật đơn đặt" khi xong. File: `app/[locale]/(main)/my-bookings/page.tsx`. |
| ~~Time slot~~ | ✅ Done — slot picker trang chi tiết phòng trước đây dùng dữ liệu giả (hash giả lập "đã đặt", chia theo giờ chứ không phải 30 phút), hoàn toàn không biết booking thật trong Supabase → nguy cơ đặt trùng (double-booking) thật. Đã thêm endpoint công khai `GET /api/rooms/:roomId/slots` (file mới `backend/src/modules/rooms/public-rooms.controller.ts`, dùng lại logic `RoomsService.computeSlots` đang chạy cho phía partner) và nối frontend gọi `getRoomAvailability()` (`lib/api/public-rooms.ts`) thay cho `generateTimeSlots()` mock. Slot quá giờ (theo giờ VN, chính xác tới phút) giờ bị đánh dấu `past` và không chọn được. File liên quan: `app/[locale]/(main)/rooms/[id]/page.tsx`, `backend/src/modules/rooms/rooms.service.ts`. |
| ~~Hold slot~~ | ✅ Done — endpoint slots giờ trả `status: "held"` + `heldUntil` cho booking pending còn trong cửa sổ giữ chỗ 5 phút (hết hạn thì coi như trống, không phải đợi cron hủy). `TimeSlotPicker` sẵn có tooltip "Một khách khác đang giữ khung giờ này" cho slot held. File: `backend/src/modules/rooms/rooms.service.ts`, `components/time-slot-picker.tsx`. |
| ~~Slot 30 phút (regression)~~ | ✅ Done — sau merge nhánh auth, `PublicRoomsController` có 2 route trùng `GET /rooms/:id/slots`: route mới (30 phút, `PublicRoomsService.getSlots`) khai báo TRƯỚC nên NestJS match nó, đè mất route 1 giờ (`RoomsService.getPublicSlots`, `SLOT_MINUTES=60`) → user lại chọn được slot :30. Frontend cũng bị đổi theo (`price: pricePerHour / 2`, mất map `isPast`). Đã gộp về 1 route duy nhất trỏ vào logic 1 giờ, port tính năng "held" của bản 30 phút vào (xem row Hold slot), xóa `PublicRoomsService.getSlots` chết, sửa lại price/isPast ở frontend. Verify live: 15 slot × 60 phút (07:00–22:00), hôm nay 7 past + 8 available đúng giờ VN, chọn 1 slot = 1h = 250.000₫. File: `backend/src/modules/rooms/public-rooms.controller.ts`, `public-rooms.service.ts`, `rooms.service.ts`, `lib/api/public-rooms.ts`, `app/[locale]/(main)/rooms/[id]/page.tsx`. |
| Room detail info | Phần “Thông số kỹ thuật” chưa hiểu thông tin, cần đổi label hoặc trình bày rõ hơn. |
| ~~Supplier create room~~ | ✅ Done (re-tested sau rebase) — flow tạo venue/room supplier hoạt động đúng, validate + auth guard + DTO khớp nhau. File: `app/[locale]/partner/venues/page.tsx`, `backend/src/modules/rooms/venues.controller.ts`, `venues.service.ts`. `console.log`/`console.error` debug trong `venues.service.ts` đã được dọn. |
| ~~Supplier QR scanner~~ | ✅ Done — camera lỗi quyền/không có camera giờ hiện toast báo lỗi rõ ràng (trước đó im lặng không làm gì). Sửa thêm cleanup `stop()` trước `clear()` tránh camera chạy ngầm. File: `app/[locale]/partner/scanner/page.tsx`. |
| ~~Manager CRUD API~~ | ✅ Done — rà lại toàn bộ khu admin sau các đợt merge: `admin/bookings`, `admin/rooms`, `room-status-overview`, `pending-suppliers`, `admin/suppliers` đã gọi API thật từ trước. 3 chỗ còn mock đã thay: (1) **`admin/users`** — bảng `mockUsers` cứng → gọi `GET /api/users` (endpoint admin có sẵn, thêm `bookingsCount` thật cho từng user), ô search giờ filter thật theo tên/email/SĐT, bỏ nút "View" chết; (2) **`stats-grid`** (dashboard) — 4 số bịa ("1,284 users", "₫14.2M"...) → tính thật từ rooms/bookings/users API, bỏ % trend giả; (3) **`recent-bookings`** (dashboard) — mảng cứng 5 đơn → 6 đơn mới nhất từ API. Tiện thể sửa 2 bug backend: `findAllForAdmin` cắt `start_time.slice(0,5)` trên timestamptz → hiện "2026-" thay vì giờ (giờ convert đúng giờ VN HH:mm), và tên khách giờ fallback qua `guest_name` cho đơn guest checkout. Verify: endpoint 401 khi chưa auth (guard đúng), query + format đối chiếu trực tiếp DB thật ra đúng dữ liệu. **Cần 1 lần login admin bấm thử 3 trang để xác nhận UI** (không có credentials admin trong repo nên chưa click-through được). File: `app/[locale]/admin/users/page.tsx`, `_components/stats-grid.tsx`, `_components/recent-bookings.tsx`, `lib/api/admin.ts`, `lib/types/index.ts`, `backend/src/modules/bookings/bookings.service.ts`, `backend/src/modules/users/users.service.ts`. Analytics/Settings là "Coming Soon" có chủ đích, không tính mock. |
| ~~Mock data~~ | ✅ Done — kết quả rà soát: (1) **"10' giữ chỗ"**: banner giữ chỗ ở trang chi tiết phòng đếm ngược 10 phút trong khi backend (`hold-cleanup.service.ts`) chỉ giữ 5 phút → đổi về `5 * 60`, đồng thời nút "Cần thêm thời gian?" trước đây là nút chết → giờ bấm reset lại timer. (2) **Điểm thưởng**: đã kiểm tra — KHÔNG phải mock, chạy thật qua backend `point-transactions` + cột `profiles.points`. (3) **Thống kê đặt phòng**: dashboard partner lấy số thật qua `getPartnerDashboard()`, nhưng có 2 phần giả đã gỡ: panel "Requires Action" (luôn hiện "1 booking request…" + "Room 3B cleaning" bịa, nút không làm gì) và % trend giả (+12%/+0%) → giờ trend doanh thu tính thật theo ngày từ `revenueChart`, các card khác ẩn chip. (4) Xóa `lib/api/rooms.ts` (wrapper mock không ai import). **Còn mock (thuộc row Manager CRUD)**: `admin/bookings/page.tsx` (mảng cứng), `admin/rooms` + `room-status-overview` (dùng `lib/data/rooms`), demo-suppliers fallback trong `lib/api/admin.ts`. |
| ~~Points / revenue sync~~ | ✅ Done — gộp kết quả từ 2 row trên: điểm thưởng chạy thật qua `point-transactions` (đã kiểm tra ở row Mock data), thống kê partner dashboard + admin dashboard giờ đều tính từ dữ liệu thật (row Mock data + row Manager CRUD), phí dịch vụ 10% tính nhất quán ở backend `createHold` và checkout. Không còn số liệu bịa trên dashboard nào. |

**Người phụ trách:** Dev Booking / API Integration.

**Ưu tiên:** Cao thứ 2, vì đây là core flow đặt phòng.

---

## **Fix 3 — UI/UX Cleanup toàn app**

**Phạm vi:** sửa giao diện khó nhìn, khó hiểu, lệch layout, responsive mobile, copywriting.

| Nhóm UI/UX | Cần sửa |
| ----- | ----- |
| Visual hierarchy | Màn hình đang nhiều chữ nhỏ, card hơi nhạt, button và trạng thái chưa nổi bật. Cần tăng contrast, spacing, font-weight cho title/status/action chính. |
| Button clarity | Các nút như “Xem mã”, “Đánh dấu xong”, “Đặt ngay”, “Hủy lịch đặt phòng” cần rõ trạng thái: primary / secondary / danger. |
| Form readability | Login/Register nên rõ hơn phần chọn role, input, lỗi validate, điều khoản. |
| Role selector | Nếu role selector không thật sự cần, nên bỏ hoặc làm rõ chức năng vì hiện đang gây hiểu nhầm. |
| Card room | Room card cần rõ tên phòng, khu vực, giá, sức chứa, rating, trạng thái còn trống/hết chỗ. Note mới có nhắc phần district trên card đang để kiểu khó hiểu. |
| Order card | Đơn đặt nên tách rõ: trạng thái đơn, ngày, giờ, địa chỉ, tổng tiền, QR/pass, action. |
| Supplier dashboard | Dashboard supplier có nút “Xem xét”, “Đánh dấu xong” hơi khó hiểu; cần đổi text/action rõ hơn. |
| Footer/contact | Sửa thông tin liên hệ theo note: email và số điện thoại mới. |
| Mobile responsive | Mobile đang lỗi trắng màn hình/client error, logo bị to, giá bị tràn, icon/text bottom nav chưa align. |
| ~~UX message~~ | ⚠️ Đã đổi hướng — không bắt login nữa, xem mục "Guest checkout" cuối file. |
| Language consistency | Thống nhất tiếng Việt/tiếng Anh. Ví dụ không nên lẫn “Checkout Date”, “Checkout Time”, “District”, “Pass Room” nếu app chủ yếu tiếng Việt. |

**Người phụ trách:** UI/UX \+ Frontend polishing.

**Ưu tiên:** Làm song song sau khi Fix 1 và Fix 2 ổn logic, nhưng nên sửa sớm các lỗi mobile trắng màn hình và layout tràn vì ảnh hưởng demo.

---

# **Bảng chia task cuối cùng**

| Fix | Người làm | Phạm vi | Mức ưu tiên | Mục tiêu |
| ----- | ----- | ----- | ----- | ----- |
| **Fix 1: Auth & Account Flow** | Dev 1 | Login, Register, Verify Email, Profile, Role, Logout | P0 | User đăng nhập/đăng ký/profile ổn, có toast và validate đầy đủ |
| **Fix 2: Booking & API Flow** | Dev 2 | Đặt phòng, đơn đặt, slot, QR, supplier, manager CRUD | P0 \- P1 | Flow đặt phòng đúng, trạng thái đúng, dữ liệu sync DB/API |
| **Fix 3: UI/UX & Responsive Cleanup** | Dev 3 hoặc chia chung | Giao diện khó nhìn, text khó hiểu, mobile, spacing, button, language | P1 | App dễ nhìn, dễ hiểu, demo mượt trên desktop/mobile |

---

# **Nếu team chỉ có 2 người fix**

Chia như này là hợp lý nhất:

| Người | Nhận task |
| ----- | ----- |
| **Người 1** | Fix 1 Auth \+ một phần UI form login/register/profile |
| **Người 2** | Fix 2 Booking/API \+ một phần UI room/order/supplier |
| **Cả hai cùng làm cuối ngày** | Fix 3 UI/UX cleanup theo checklist chung |

Tức là **UI/UX không nên tách riêng nếu thiếu người**, mà gắn vào từng flow: ai fix màn nào thì phải polish UI màn đó luôn.

---

# **Checklist giao cho team cho dễ làm**

## **Task A — Fix Auth, Register, Profile**

* Fix Google/Facebook login.  
* Fix Google/Facebook register.  
* Validate email login.  
* Toast sai password.  
* Validate register: phone, email, password, confirm password, agreement.  
* Thông báo user chưa verify email.  
* Load avatar profile.  
* Toast cập nhật profile thành công.  
* Fix role login logic.  
* Fix Admin logout.  
* Xem lại Forgot password nếu còn thời gian.

## **Task B — Fix Booking, Order, Supplier, Manager**

* Sync rating/review ngoài card và detail.  
* Sửa district/address sang tiếng Việt, dễ hiểu.  
* Cho nhập số người chia tiền.  
* Disable slot đã qua giờ.  
* Disable hoặc cảnh báo slot đã có người giữ/đã đặt.  
* Đơn hủy/chưa thanh toán không xem mã thành công.  
* Nút “Làm mới” reload đúng dữ liệu.  
* Nút back ở đơn đặt quay về đúng trang detail/thông tin phòng.  
* Fix supplier tạo phòng.  
* Fix QR scanner.  
* Connect manager CRUD API.  
* Sync điểm thưởng, thống kê, phí dịch vụ nếu đang mock.

## **Task C — UI/UX Cleanup**

* Tăng độ tương phản text/card/button.  
* Sửa spacing, padding, font size.  
* Làm rõ primary action trên từng màn.  
* Đổi text khó hiểu sang tiếng Việt dễ hiểu.  
* Fix mobile trắng màn hình/client error.  
* Fix logo quá to trên mobile.  
* Fix giá bị tràn.  
* Align lại icon \+ text bottom nav.  
* Chuẩn hóa footer/contact.  
* ~~Guest book phòng phải hiện thông báo trước khi chuyển login/register.~~ (đã đổi hướng — cho phép book không cần login, xem mục "Guest checkout" cuối file)

---

# **Thứ tự nên làm để kịp demo**

1. **Fix lỗi crash / không dùng được:** social login, supplier page error, mobile client error, admin logout, QR scanner.  
2. **Fix flow chính:** register/login, đặt phòng, slot, order status, QR/pass.  
3. **Fix dữ liệu sai:** rating, district, points, statistics, manager CRUD.  
4. **Fix UI/UX:** khó nhìn, text khó hiểu, button, responsive, spacing.  
5. **Test lại full flow:** guest → login/register → book phòng → xem đơn → QR/check-in → supplier/manager xử lý.

Nói ngắn gọn để giao task: **1 người ôm Auth/Profile, 1 người ôm Booking/API, UI/UX là tiêu chuẩn bắt buộc sau mỗi màn chứ không phải task phụ.**

---

# ~~Guest checkout (book without login)~~ ✅ Done (còn 2 hạn chế nhỏ, xem dưới)

**Đã làm:** Cho phép đặt phòng không cần đăng nhập — khách điền tên/SĐT/email ở `GuestInfoForm`, hệ thống lưu vào `bookings.guest_name/guest_phone/guest_email` (cột mới, `customer_id` để null). Migration đã apply vào Supabase thật: `supabase/migrations/20260628000000_guest_bookings.sql`. Logic ở `app/[locale]/(main)/checkout/page.tsx`.

**2 hạn chế còn tồn (chưa fix, cần làm tiếp nếu có thời gian):**

| Hạn chế | Chi tiết | Vì sao chưa fix ngay |
| ----- | ----- | ----- |
| Hủy giữ chỗ không tức thời cho guest | Khách vãng lai (không login) bấm "Hủy" hoặc rời trang giữa chừng — hệ thống **không hủy được ngay** vì API hủy (`cancelPendingBooking`) yêu cầu JWT, guest không có token. Slot vẫn bị giữ tối đa 5 phút rồi mới tự giải phóng qua `HoldCleanupService` (cron 1 phút/lần, đã có sẵn) — không bị kẹt vĩnh viễn, chỉ là chậm giải phóng. | Muốn fix đúng cần thêm endpoint hủy riêng cho guest (không qua JWT) — nhưng phải cẩn thận để không cho phép hủy bừa booking của người khác (cần kiểm tra kỹ cơ chế xác thực guest, ví dụ theo booking_code). |
| Guest không tự xem lại đơn sau khi rời trang | Trang "Đơn của tôi" (`my-bookings`) hiện chỉ tra theo `customer_id` (tài khoản đã login). Guest đặt xong, nếu rời trang xác nhận thì **không có cách tự tra lại đơn** trên web (chỉ có thông tin lúc xác nhận ngay sau khi đặt). | Cần thêm tra cứu theo SĐT + mã đơn (booking_code) — đúng như hướng cũ trong CLAUDE.md ("myBookings → GET /api/bookings by phone token") nhưng chưa implement. Phải thiết kế kỹ để không cho phép dò SĐT người khác xem trộm đơn. |

**Ưu tiên:** Thấp hơn Fix 1/2/3 ở trên — không chặn flow chính, chỉ ảnh hưởng UX của khách vãng lai trong vài trường hợp cạnh.


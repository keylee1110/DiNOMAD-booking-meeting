# Dinomad Supabase Database v0.1

Tài liệu này mô tả database schema ban đầu cho backend Dinomad. Scope hiện tại tập trung vào 2 module chính:

- `users`: định danh, profile, role, trạng thái tài khoản.
- `suppliers` / `partners`: hồ sơ đối tác, thành viên quản trị, venue và room inventory.

Booking, payment, review và notification nên tách sang migration sau khi team chốt flow đặt phòng.

## Auth Decision

Dùng Supabase Auth là ổn cho giai đoạn hiện tại.

Lý do:

- Có sẵn email/password, OTP, magic link, social login.
- Supabase Auth phát JWT, NestJS có thể verify JWT cho API backend.
- Tích hợp tốt với Postgres RLS bằng `auth.uid()`.
- Không phải tự build password hashing, reset password, email verification.

Điểm cần thống nhất:

- Supabase Auth chỉ quản lý identity trong `auth.users`.
- App không query trực tiếp `auth.users`; app dùng `public.profiles`.
- Phân quyền nghiệp vụ nằm trong `public.profiles`, `public.supplier_members` và NestJS guards.
- Nếu frontend gọi Supabase trực tiếp, bắt buộc giữ RLS bật cho các bảng public.

## Main Tables

### `auth.users`

Table nội bộ của Supabase Auth. Không tự tạo, không tự sửa schema.

### `public.profiles`

Profile app tương ứng 1-1 với `auth.users`.

Field chính:

- `id`: UUID, FK đến `auth.users.id`.
- `email`
- `full_name`
- `phone`
- `avatar_url`
- `role`: `customer`, `supplier`, `admin`
- `status`: `active`, `blocked`, `deleted`

Khi user mới đăng ký Auth, trigger `handle_new_auth_user()` tự tạo profile.

### `public.suppliers`

Hồ sơ doanh nghiệp/đối tác.

Field chính:

- `legal_name`: tên pháp lý.
- `display_name`: tên hiển thị.
- `tax_code`
- `business_email`
- `business_phone`
- `status`: `pending`, `approved`, `rejected`, `suspended`
- `approved_by`, `approved_at`

### `public.supplier_members`

Quan hệ nhiều-nhiều giữa user và supplier.

Một supplier có thể có nhiều tài khoản quản trị:

- `owner`: chủ tài khoản partner.
- `manager`: quản lý venue/room/member.
- `staff`: nhân viên xem lịch, check-in, vận hành.

### `public.venues`

Địa điểm thuộc supplier.

Field chính:

- `supplier_id`
- `name`, `name_vi`
- `description`, `description_vi`
- `address`, `address_vi`
- `district`, `city`
- `lat`, `lng`
- `status`: `draft`, `pending_review`, `published`, `suspended`

### `public.rooms`

Phòng/không gian đặt chỗ thuộc venue.

Field chính:

- `venue_id`
- `name`, `name_vi`
- `description`, `description_vi`
- `capacity`
- `price_per_hour`
- `category`: `team_hub`, `solo_nook`
- `status`: `draft`, `published`, `unavailable`, `archived`
- `verified`
- `noise_level`
- `specs`, `specs_vi`: JSONB cho thông số linh hoạt như TV, HDMI, wifi, AC.

### Room metadata tables

- `room_images`
- `room_amenities`
- `room_vibe_tags`

Tách riêng để filter/search tốt hơn so với nhét tất cả vào JSON.

## Supplier Application Flow

Frontend hoặc NestJS gọi RPC:

```sql
select public.submit_supplier_application(
  legal_name := 'Dinomad Partner Co., Ltd.',
  display_name := 'The Coffee Lab',
  tax_code := '0312345678',
  business_email := 'partner@example.com',
  business_phone := '0901234567',
  onboarding_note := 'Muon dang ky 2 chi nhanh tai TP.HCM'
);
```

RPC này sẽ:

- Tạo row trong `suppliers` với status `pending`.
- Tạo membership `owner` cho user hiện tại.
- Chuyển `profiles.role` từ `customer` sang `supplier` nếu user đang là customer.

Admin sẽ review và đổi `suppliers.status` sang `approved`.

Nếu gọi từ NestJS bằng `service_role`, dùng RPC server-side:

```sql
select public.submit_supplier_application_for_user(
  target_user_id := '00000000-0000-0000-0000-000000000000',
  legal_name := 'Dinomad Partner Co., Ltd.',
  display_name := 'The Coffee Lab'
);
```

Backend skeleton hiện dùng RPC này vì `service_role` không đại diện cho `auth.uid()` của user đang gọi API.

## RLS Rules

Tất cả bảng public đều bật Row Level Security.

Rule chính:

- User chỉ đọc/sửa profile của mình.
- User không được tự nâng `role` hoặc đổi `status`; trigger sẽ giữ giá trị cũ nếu tự sửa.
- Admin đọc được toàn bộ supplier.
- Supplier member đọc được supplier/venue/room của mình.
- Supplier owner/manager quản lý venue, room, room images, amenities, vibe tags.
- Public chỉ đọc được venue/room đã `published`.

Backend NestJS nếu dùng Supabase `service_role` key sẽ bypass RLS. Key này chỉ được nằm trong server env, không bao giờ đưa xuống frontend.

## Migration File

Schema nằm ở:

```txt
supabase/migrations/20260531000000_initial_user_supplier_schema.sql
```

Chạy migration này trước khi backend bắt đầu code module `users` và `suppliers`.

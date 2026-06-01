# Supabase Setup Guide

Tài liệu này hướng dẫn tạo database Supabase cho Dinomad và chuẩn bị env cho NestJS backend.

## 1. Tạo Supabase Project

1. Vào Supabase Dashboard.
2. Chọn **New project**.
3. Chọn organization của team.
4. Đặt project name, ví dụ `dinomad-dev`.
5. Chọn region gần user chính. Với thị trường Việt Nam, ưu tiên Singapore nếu có.
6. Lưu database password vào password manager của team.
7. Chờ project provision xong.

Khuyến nghị tạo ít nhất 2 project:

- `dinomad-dev`: development.
- `dinomad-prod`: production.

Không dùng chung dev và prod database.

## 2. Chạy Schema Migration

Cách nhanh nhất ở giai đoạn đầu:

1. Mở Supabase Dashboard.
2. Vào **SQL Editor**.
3. Mở file local:

```txt
supabase/migrations/20260531000000_initial_user_supplier_schema.sql
```

4. Copy toàn bộ SQL vào SQL Editor.
5. Bấm **Run**.

Sau khi chạy xong, kiểm tra trong **Table Editor** có các bảng:

- `profiles`
- `suppliers`
- `supplier_members`
- `venues`
- `rooms`
- `room_images`
- `room_amenities`
- `room_vibe_tags`

## 3. Bật Và Cấu Hình Auth

Vào **Authentication > Providers**:

- Bật **Email** provider.
- Bật confirm email nếu muốn user phải xác thực email trước khi dùng app.
- Social login có thể thêm sau, không cần cho v0.1.

Vào **Authentication > URL Configuration**:

- Site URL dev: URL frontend local hoặc deployed frontend dev.
- Redirect URLs:
  - `http://localhost:3000/**`
  - domain frontend dev
  - domain production khi có

## 4. Lấy API Keys Và Connection String

Vào **Project Settings > API**:

- `SUPABASE_URL`: Project URL.
- `SUPABASE_ANON_KEY`: dùng cho frontend hoặc request public/authenticated theo RLS.
- `SUPABASE_SERVICE_ROLE_KEY`: chỉ dùng ở backend server. Không commit, không đưa vào frontend.

Vào **Project Settings > Database**:

- Lấy Postgres connection string.
- Với NestJS server chạy dài hạn, ưu tiên pooler session mode hoặc direct connection nếu môi trường host hỗ trợ.
- Với serverless runtime, ưu tiên pooler transaction mode.

## 5. Env Cho NestJS Backend

Tạo `.env` cho backend, ví dụ:

```env
NODE_ENV=development
PORT=4000

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

DATABASE_URL=postgresql://postgres.your-project-ref:your-password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

Nếu dùng Prisma, `DATABASE_URL` là env chính cho ORM. Nếu dùng Supabase JS admin client, dùng `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.

## 6. NestJS Auth Strategy

Luồng đề xuất:

1. Frontend dùng Supabase Auth để login/register.
2. Frontend gửi JWT trong header:

```http
Authorization: Bearer <supabase_access_token>
```

3. NestJS verify JWT hoặc gọi Supabase Admin API để lấy user.
4. NestJS load `profiles` và `supplier_members` để build permission context.
5. Controller dùng guard:
   - `JwtAuthGuard`
   - `RolesGuard`
   - `SupplierMemberGuard`

Không nên tự lưu password trong NestJS database.

## 7. Supabase Có Host Backend NestJS Không?

Supabase host database, auth, storage, realtime và edge functions. Supabase không phải nơi phù hợp để host NestJS Express server truyền thống.

Đề xuất:

- Supabase: database + auth + storage.
- NestJS backend: host ở Render, Railway, Fly.io, VPS, hoặc container platform.
- Frontend Next.js: Vercel hoặc host riêng.

Khi deploy backend, chỉ set env server-side. Đặc biệt `SUPABASE_SERVICE_ROLE_KEY` không được expose ra client.

## 8. Development Workflow Cho Team

Quy trình khuyến nghị:

1. Mọi thay đổi DB đi qua file migration trong `supabase/migrations`.
2. Không sửa table trực tiếp trên production bằng Table Editor.
3. Dev chạy migration trên `dinomad-dev` trước.
4. Backend cập nhật DTO/service/entity theo migration.
5. Khi ổn mới apply migration sang `dinomad-prod`.

## 9. Checklist Sau Khi Setup

- Tạo được Supabase project.
- Chạy migration không lỗi.
- Đăng ký user mới trong Auth.
- Kiểm tra `profiles` tự sinh row sau signup.
- Gọi được `submit_supplier_application`.
- Thấy supplier mới status `pending`.
- Thấy `supplier_members` có membership `owner`.
- Admin đổi supplier status sang `approved`.
- Backend đọc được DB bằng `DATABASE_URL`.


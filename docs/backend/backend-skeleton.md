# Backend Skeleton Guide

Backend đã được tách thành package riêng ở `backend/` để không trộn code NestJS với Next.js frontend.

## Có Nên Tách `users` Và `suppliers` Thành 2 Module?

Có. Với cách chia team hiện tại thì nên tách ngay:

- `users`: profile, role, trạng thái tài khoản, admin xem user.
- `suppliers`: partner application, supplier profile, member, venue/room sau này.

Lý do:

- 2 người làm user không đụng quá nhiều vào phần partner.
- 1 người làm supplier có module riêng để mở rộng.
- Auth/database/common được dùng chung, tránh copy logic.

## Folder Chính

```txt
backend/src/
  common/
    decorators/
    filters/
    interceptors/
    types/
  config/
  database/
  modules/
    auth/
    health/
    users/
    suppliers/
```

## Task Gợi Ý Cho Team

### User developer 1

- Hoàn thiện `GET /users/me`.
- Hoàn thiện `PATCH /users/me`.
- Validate phone/avatar/name kỹ hơn.
- Viết test cho `UsersService`.

### User developer 2

- Hoàn thiện admin user listing `GET /users`.
- Thêm filter/search/pagination.
- Thêm block/unblock user cho admin.
- Viết DTO và guard role admin.

### Supplier developer

- Hoàn thiện `POST /suppliers/applications`.
- Hoàn thiện `GET /suppliers/me`.
- Thêm approve/reject flow cho admin.
- Sau đó mở rộng module `venues` và `rooms` bên trong supplier domain hoặc tách module riêng khi lớn hơn.

## API Convention

Response thành công:

```json
{
  "success": true,
  "data": {}
}
```

Response lỗi:

```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Validation failed"
  }
}
```

## Chạy Backend

```bash
pnpm install
cp backend/.env.example backend/.env
pnpm dev:backend
```

Backend mặc định chạy ở:

```txt
http://localhost:4000/api
```


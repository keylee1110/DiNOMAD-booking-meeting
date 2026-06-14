# DiNOMAD Backend — Architecture & Setup Guide

> **Stack:** NestJS 10 · TypeScript · Supabase (PostgreSQL) · PayOS  
> **You are in:** `backend/` inside the DiNOMAD monorepo  
> **Package name:** `@dinomad/backend`  
> **Audience:** Backend developers. Keep this in sync with `docs/backend-api-spec.md`.

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Folder Structure](#2-folder-structure)
3. [NestJS Patterns](#3-nestjs-patterns)
4. [Supabase Setup](#4-supabase-setup)
5. [Auth Pattern](#5-auth-pattern)
6. [Request / Response Conventions](#6-request--response-conventions)
7. [Error Handling](#7-error-handling)
8. [Validation Pattern](#8-validation-pattern)
9. [Slot Locking](#9-slot-locking)
10. [Payment Flow (PayOS)](#10-payment-flow-payos)
11. [Cancellation & Refund Logic](#11-cancellation--refund-logic)
12. [Notifications](#12-notifications)
13. [Environment Variables](#13-environment-variables)
14. [Development Workflow](#14-development-workflow)

---

## 1. Project Setup

### Monorepo is already configured

`pnpm-workspace.yaml` at the repo root:
```yaml
packages:
  - "."         # Next.js frontend (root package)
  - "backend"   # NestJS backend (@dinomad/backend)
```

Root `package.json` shortcut scripts:
```bash
pnpm dev             # → next dev           (frontend, port 3000)
pnpm dev:backend     # → nest start --watch  (backend,  port 3001)
pnpm build:backend   # → nest build
```

### Working in the backend

```bash
# From repo root
pnpm dev:backend

# Or from backend/ directly
cd backend && pnpm dev
```

### Install new backend dependencies

```bash
# Always install from backend/ (not root — root deps belong to Next.js)
cd backend
pnpm add @nestjs/jwt @nestjs/passport passport-jwt
pnpm add -D @types/passport-jwt
```

---

## 2. Folder Structure

```
backend/                          ← @dinomad/backend (NestJS)
├── src/
│   ├── main.ts                   # Bootstrap NestJS app, port 3001
│   ├── app.module.ts             # Root module — imports all feature modules
│   ├── config/                   # ConfigModule setup, env validation (Zod)
│   ├── database/                 # SupabaseService provider (admin + anon clients)
│   ├── common/
│   │   ├── decorators/           # @CurrentUser(), @Roles()
│   │   ├── filters/              # GlobalExceptionFilter → { error: { code } }
│   │   ├── interceptors/         # ResponseInterceptor → { data: T }
│   │   └── types/                # Backend-only types
│   └── modules/                  # One folder per feature domain
│       ├── auth/                 # ✅ JwtAuthGuard, RolesGuard, auth.service.ts
│       ├── users/                # ✅ GET/PATCH /users/me, GET /users (admin)
│       ├── suppliers/            # ✅ GET/POST/PATCH /suppliers/*
│       ├── health/               # ✅ GET /health
│       ├── rooms/                # 🔲 ADD: room search, detail, slot availability
│       │   ├── rooms.module.ts
│       │   ├── rooms.controller.ts
│       │   ├── rooms.service.ts
│       │   ├── slots.service.ts  # availability_slots queries + slot locking
│       │   └── dto/
│       ├── bookings/             # 🔲 ADD: create, list, cancel, check-in
│       ├── payments/             # 🔲 ADD: PayOS integration, webhook handler
│       ├── partner/              # 🔲 ADD: partner dashboard, earnings
│       ├── admin/                # 🔲 ADD: admin stats, analytics, room management
│       └── notifications/        # 🔲 ADD: SMS/Zalo sender
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── .env                          # Never commit
├── .env.example                  # Commit this
└── package.json
```

---

## 3. NestJS Patterns

### Route → Controller → Service

```
HTTP Request
    → Guards      (JwtAuthGuard validates Bearer token, RolesGuard checks role)
    → Pipes       (ValidationPipe transforms + validates DTO)
    → Controller  (parse req, call service, return result)
    → Service     (business logic + Supabase queries)
    → Supabase    (database)
    → Interceptor (wraps result in { data })
    → Filter      (catches any thrown exception → { error: { code } })
```

**Rule:** Never put Supabase queries in controllers. Never put HTTP logic in services.

### Existing patterns to follow

**Module (look at `src/modules/users/` for reference):**
```ts
@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

**Controller:**
```ts
@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.findMe(user.id)
  }

  @Patch("me")
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(user.id, dto)
  }

  @Get()
  @Roles("admin")
  @UseGuards(RolesGuard)
  findAll() {
    return this.usersService.findAll()
  }
}
```

**Service:**
```ts
@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

  async findMe(userId: string) {
    const { data, error } = await this.supabase.admin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (error) throw new NotFoundException("Profile not found")
    return data
  }
}
```

**DTO with class-validator:**
```ts
export class UpdateUserDto {
  @IsString()
  @IsOptional()
  full_name?: string

  @IsString()
  @IsOptional()
  phone?: string

  @IsUrl()
  @IsOptional()
  avatar_url?: string
}
```

**Guards:**
```ts
// Protect any authenticated route:
@UseGuards(JwtAuthGuard)

// Protect a role-restricted route (add after JwtAuthGuard):
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")

// Or for supplier-only:
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("supplier")
```

---

## 4. Supabase Setup

The `SupabaseService` is provided via `DatabaseModule` (already registered in `app.module.ts`). Inject it — never instantiate a new client.

```ts
@Injectable()
export class SupabaseService {
  // Admin client: bypasses RLS — use for all backend service operations
  admin: SupabaseClient

  // Anon client: respects RLS — use only if you need user-scoped queries
  anon: SupabaseClient
}
```

**Usage:**
```ts
// ✅ In any service: inject SupabaseService
constructor(private readonly supabase: SupabaseService) {}

// Select
const { data, error } = await this.supabase.admin
  .from("rooms")
  .select("*, venues(*)")
  .eq("id", roomId)
  .single()

if (error) throw new NotFoundException("Room not found")

// Insert
const { data: booking } = await this.supabase.admin
  .from("bookings")
  .insert({ room_id, customer_id, start_time, end_time, subtotal, platform_fee, total_amount })
  .select()
  .single()

// Update
await this.supabase.admin
  .from("bookings")
  .update({ status: "confirmed" })
  .eq("id", bookingId)

// RPC call
const { data: supplierId } = await this.supabase.admin
  .rpc("submit_supplier_application_for_user", { target_user_id, legal_name, display_name, ... })
```

---

## 5. Auth Pattern

**Supabase Auth** is the identity provider. The backend validates Supabase JWTs on every protected request.

### How it works

1. Client signs in via `supabase.auth.signInWithPassword()` or OAuth
2. Client sends `Authorization: Bearer <access_token>` on every API request
3. `JwtAuthGuard` calls `supabase.admin.auth.getUser(token)` to validate
4. If valid, extracts user ID and queries `profiles` for role
5. Attaches `{ id, email, role }` to the request as `req.user`
6. `RolesGuard` + `@Roles()` decorator enforce role-based access

### JwtAuthGuard (already implemented in `src/modules/auth/`)

```ts
// Validates the Bearer token and populates req.user
// Usage: @UseGuards(JwtAuthGuard) on any controller or route
```

### RolesGuard + @Roles decorator (already implemented)

```ts
// Checks req.user.role against the @Roles() decorator
// Must always be used together with JwtAuthGuard
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
```

### @CurrentUser decorator (already implemented)

```ts
// Extracts the authenticated user from req.user
@Get("me")
getMe(@CurrentUser() user: AuthUser) {
  // user = { id: string, email: string, role: app_role }
}
```

### Guest checkout (no account)

For bookings made without a registered account:
- `booking.customer_id` can reference a guest profile created at checkout
- `booking.guest_token` (UUID) is returned in the response and sent via SMS
- The guest uses `GET /bookings/:id?token=<guest_token>` to view their booking
- The backend verifies the token matches the booking's `guest_token` field

---

## 6. Request / Response Conventions

### Always return `{ data }` on success

The global `ResponseInterceptor` (already wired in `app.module.ts`) wraps every successful response automatically.

```ts
// ✅ Return raw data from service — interceptor wraps it
async findAll() {
  const { data } = await this.supabase.admin.from("rooms").select("*")
  return data  // → response body becomes { data: [...] }
}

// ✅ For paginated results, return { data, meta }
return {
  data: rooms,
  meta: { total, page, limit }
}
// → response body becomes { data: { data: [...], meta: {...} } }
// Adjust interceptor if needed to keep meta at top level
```

### HTTP status codes

```ts
@Post()                    // → 201 Created (NestJS default for POST)
@Get()                     // → 200 OK
@Patch()                   // → 200 OK
@Delete()                  // → 200 OK (or use @HttpCode(204))
```

---

## 7. Error Handling

The global `HttpExceptionFilter` (already wired) catches all exceptions and formats them as `{ error: { code, message } }`.

**Throw NestJS built-in exceptions — never return error objects:**

```ts
import {
  NotFoundException, ForbiddenException,
  BadRequestException, ConflictException,
  UnauthorizedException
} from "@nestjs/common"

// ✅ Correct
throw new NotFoundException("Room not found")
throw new ConflictException("SLOT_UNAVAILABLE")
throw new ForbiddenException("FORBIDDEN")
throw new BadRequestException("VALIDATION_ERROR")

// ❌ Wrong
return { error: "not found" }
res.status(404).json({ error: "not found" })
```

**Custom error codes for bilingual messages:**

```ts
// The HttpExceptionFilter maps known codes to bilingual messages
const MESSAGES: Record<string, { en: string; vi: string }> = {
  SLOT_UNAVAILABLE:  { en: "Time slot no longer available", vi: "Khung giờ không còn trống" },
  BOOKING_LOCKED:    { en: "Slot is held by another user",  vi: "Khung giờ đang được giữ" },
  PAYMENT_FAILED:    { en: "Payment failed",                vi: "Thanh toán thất bại" },
}
```

---

## 8. Validation Pattern

Use **class-validator DTOs** for all request body validation. NestJS's global `ValidationPipe` runs automatically (already configured in `main.ts` with `whitelist: true, forbidNonWhitelisted: true, transform: true`).

```ts
// dto/create-booking.dto.ts
import { IsString, IsUUID, IsEnum, IsInt, IsOptional, Min } from "class-validator"

export class CreateBookingDto {
  @IsUUID()
  room_id: string

  @IsString()
  start_time: string   // ISO 8601 timestamp

  @IsString()
  end_time: string

  @IsEnum(["vietqr", "momo", "zalopay", "card"])
  payment_method: string

  @IsInt()
  @Min(0)
  @IsOptional()
  points_redeemed?: number
}
```

```ts
// Controller usage — DTO is automatically validated by global ValidationPipe
@Post()
async create(@Body() dto: CreateBookingDto, @CurrentUser() user: AuthUser) {
  return this.bookingsService.create(dto, user.id)
}
```

---

## 9. Slot Locking

Slot locking prevents double bookings. Uses the `availability_slots` table.

**The lock flow:**

```
1. GET /rooms/:id/slots → frontend shows available slots
2. POST /bookings → backend holds selected slots (slot_status = 'held', held_until = now + 5 min)
3. User pays within 5 min → PayOS webhook → backend sets slot_status = 'booked'
4. If user doesn't pay → backend or cron resets held slots to 'available'
```

**Implementation pattern (to build in `slots.service.ts`):**

```ts
// Check and hold slots for checkout
async holdSlots(roomId: string, startTime: Date, endTime: Date, bookingId: string) {
  // 1. Check for any non-available slots in range
  const { data: conflicts } = await this.supabase.admin
    .from("availability_slots")
    .select("id, slot_status")
    .eq("room_id", roomId)
    .gte("slot_start", startTime.toISOString())
    .lt("slot_start", endTime.toISOString())
    .neq("slot_status", "available")

  if (conflicts?.length) throw new ConflictException("SLOT_UNAVAILABLE")

  // 2. Hold all slots in range
  const heldUntil = new Date(Date.now() + 5 * 60 * 1000)  // 5 min
  await this.supabase.admin
    .from("availability_slots")
    .update({ slot_status: "held", held_until: heldUntil.toISOString(), booking_id: bookingId })
    .eq("room_id", roomId)
    .gte("slot_start", startTime.toISOString())
    .lt("slot_start", endTime.toISOString())
}

// Release held slots (on payment timeout or cancellation)
async releaseSlots(bookingId: string) {
  await this.supabase.admin
    .from("availability_slots")
    .update({ slot_status: "available", held_until: null, booking_id: null })
    .eq("booking_id", bookingId)
    .eq("slot_status", "held")
}

// Confirm slots after payment
async confirmSlots(bookingId: string) {
  await this.supabase.admin
    .from("availability_slots")
    .update({ slot_status: "booked" })
    .eq("booking_id", bookingId)
    .eq("slot_status", "held")
}
```

**Expired hold cleanup:** Implement a scheduled NestJS `@Cron` task or rely on a Supabase Edge Function to release slots where `held_until < now()`.

---

## 10. Payment Flow (PayOS)

```ts
// services/payment.service.ts
import PayOS from "@payos/node"

@Injectable()
export class PaymentService {
  private payos: PayOS

  constructor(private config: ConfigService) {
    this.payos = new PayOS(
      config.get("PAYOS_CLIENT_ID"),
      config.get("PAYOS_API_KEY"),
      config.get("PAYOS_CHECKSUM_KEY")
    )
  }

  async createPaymentLink(booking: Booking) {
    const orderCode = Date.now()  // unique numeric order code

    const response = await this.payos.createPaymentLink({
      orderCode,
      amount: booking.total_amount,
      description: `DN ${booking.booking_code}`,
      cancelUrl: `${this.config.get("FRONTEND_URL")}/checkout/cancel`,
      returnUrl: `${this.config.get("FRONTEND_URL")}/checkout/success`,
      expiredAt: Math.floor(Date.now() / 1000) + 300,  // 5 min
    })

    return response.checkoutUrl
  }

  verifyWebhook(body: unknown) {
    return this.payos.verifyPaymentWebhookData(body)
  }
}
```

### Webhook handler (to build in `payments` module)

```ts
@Post("/webhooks/payment")
async handlePayment(@Body() body: unknown, @Res() res: Response) {
  const verified = this.paymentService.verifyWebhook(body)
  if (!verified) return res.status(400).json({ error: "Invalid signature" })

  const { code, data } = body as PayOSWebhookBody

  if (code === "00") {  // payment success
    // 1. Find booking by orderCode
    // 2. Update booking status → confirmed
    // 3. Update payments record → successful
    // 4. confirmSlots(bookingId)
    // 5. Send confirmation notification to guest
    // 6. Send new_booking_alert to partner
  }

  res.json({ success: true })
}
```

---

## 11. Cancellation & Refund Logic

```ts
// Refund calculation
calculateRefund(booking: Booking, initiatedBy: "guest" | "venue" | "admin"): number {
  if (initiatedBy === "venue" || initiatedBy === "admin") {
    return booking.total_amount  // always 100%
  }

  const sessionStart = new Date(booking.start_time)
  const hoursUntil = (sessionStart.getTime() - Date.now()) / (1000 * 60 * 60)

  if (hoursUntil > 24) return booking.total_amount                       // 100%
  if (hoursUntil >= 4) return Math.round(booking.total_amount * 0.7)    // 70%
  return 0                                                                // 0%
}
```

**Cancellation steps:**
1. Calculate refund amount
2. Call PayOS refund API if refund_amount > 0
3. Set `booking.status = 'cancelled'`
4. Release availability slots back to `available`
5. Notify guest (cancellation + refund status)
6. Notify partner (if cancelled by guest)

---

## 12. Notifications

Use **Zalo OA API** for Vietnamese users. Email as fallback. Log every sent message to the `notifications` table.

```ts
// Pattern for any notification
async sendBookingConfirmation(booking: Booking) {
  const message = [
    `✅ DiNOMAD xác nhận đặt phòng!`,
    `Mã đặt phòng: ${booking.booking_code}`,
    `Thời gian: ${formatDate(booking.start_time)} – ${formatTime(booking.end_time)}`,
    `Xem chi tiết: ${this.config.get("FRONTEND_URL")}/my-bookings?token=${booking.guest_token}`
  ].join("\n")

  await this.sendZalo(booking.guest_phone, message)

  // Log to notifications table
  await this.supabase.admin.from("notifications").insert({
    booking_id: booking.id,
    type: "booking_confirmed",
    channel: "zalo",
    recipient: booking.guest_phone,
    message_preview: message.slice(0, 200),
    status: "sent"
  })
}
```

**Notification types:**

| Type | Recipient | When |
|---|---|---|
| `booking_confirmed` | Guest | PayOS webhook success |
| `booking_reminder` | Guest | 15 min before session start |
| `booking_cancelled` | Guest | On cancellation |
| `new_booking_alert` | Partner | On new confirmed booking for their room |
| `refund_processing` | Guest | On refund initiated |
| `refund_completed` | Guest | On refund confirmed |

---

## 13. Environment Variables

`backend/.env.example` (commit this; never commit `.env`):

```env
# Server
PORT=3001
NODE_ENV=development
API_PREFIX=v1
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # NEVER expose to frontend

# PayOS
PAYOS_CLIENT_ID=xxx
PAYOS_API_KEY=xxx
PAYOS_CHECKSUM_KEY=xxx

# Notifications
ZALO_OA_ACCESS_TOKEN=xxx
SMTP_HOST=smtp.gmail.com
SMTP_USER=noreply@dinomad.vn
SMTP_PASS=xxx

# Business Rules
PLATFORM_FEE_RATE=0.10
SLOT_LOCK_SECONDS=300
```

Env validation uses Zod in `src/config/env.validation.ts` — the app refuses to start if any required variable is missing (fail-fast).

---

## 14. Development Workflow

### Branches

```
main      ← production, protected
develop   ← integration branch  
feat/xxx  ← feature branches (branch from develop)
fix/xxx   ← bug fixes
```

### PR Rules

- All PRs merge into `develop`, never directly into `main`
- At least 1 review before merge
- Must pass `pnpm lint` with zero errors

### Commit Convention

```
feat: add slot locking service
fix: correct refund calculation for 4-24h window
chore: add PayOS dependency
docs: update backend API spec with implemented endpoints
```

### API Testing

Use **Bruno** (recommended, open-source) or Postman. Export the collection to `docs/api-collection.json` and commit it for the team.

---

## Absolute Rules

```
❌ NEVER put Supabase queries in controllers — only in services
❌ NEVER hardcode the platform fee — use ConfigService: get('PLATFORM_FEE_RATE')
❌ NEVER return raw Supabase error objects — always throw an HttpException
❌ NEVER create a new Supabase client instance — inject SupabaseService
❌ NEVER skip DTO validation — every @Body() must have a DTO class
❌ ALWAYS follow the module pattern in src/modules/auth and src/modules/users
```

---

*Last updated: June 2026 — NestJS 10 / feat/ViNTD*

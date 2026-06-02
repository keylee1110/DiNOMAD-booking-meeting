# Dinomad Backend

NestJS Express backend skeleton for Dinomad.

## Module Ownership

- 2 developers: `src/modules/users`
- 1 developer: `src/modules/suppliers`
- Shared code: `src/common`, `src/config`, `src/database`, `src/modules/auth`

Keep shared code changes small and coordinated because all modules depend on it.

## Local Setup

```bash
pnpm install
cp backend/.env.example backend/.env
pnpm --filter @dinomad/backend dev
```

API base URL:

```txt
http://localhost:4000/api
```

## Auth Flow

Frontend logs in with Supabase Auth and sends the Supabase access token:

```http
Authorization: Bearer <supabase_access_token>
```

Backend `JwtAuthGuard` validates the token with Supabase and attaches `request.user`.

## Initial Endpoints

```txt
GET    /api/health
GET    /api/users/me
PATCH  /api/users/me
GET    /api/users
GET    /api/suppliers/me
POST   /api/suppliers/applications
GET    /api/suppliers
GET    /api/suppliers/:id
PATCH  /api/suppliers/:id
```

The current services use Supabase admin client. `SUPABASE_SERVICE_ROLE_KEY` must stay server-side only.


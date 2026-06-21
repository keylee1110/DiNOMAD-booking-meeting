# Plan: SePay Payment Integration

## Overview
This plan outlines the integration of the SePay bank transfer payment automation gateway for **Dinomad**. This replaces the simulated mock payment flow with real-time VietQR code generation and webhook verification.

## Project Type
- **WEB**: Next.js 16 (frontend) & NestJS (backend)

## Success Criteria
1. When selecting "VietQR" on the checkout page, a real SePay-hosted bank transfer QR code is displayed with correct amount and booking code.
2. NestJS backend exposes `/api/payments/sepay-webhook` which receives and validates payment notifications from SePay.
3. SePay transactions matching the booking code will automatically update the booking status to `confirmed` and `payment_status` to `deposited` or `fully_paid`.
4. A payment log is inserted into the `payments` table.
5. The frontend automatically detects the payment update (using Supabase Realtime) and redirects the user to the success page.

## Tech Stack
- **Frontend**: Next.js 16 (App Router), `@supabase/supabase-js` (Realtime subscription)
- **Backend**: NestJS, `@supabase/supabase-js` (Admin client)
- **Database**: Supabase PostgreSQL (`bookings`, `payments` tables)
- **Payment API**: SePay Webhooks & VietQR Quick Link

## File Structure
```
Dinomad/
├── app/[locale]/(main)/checkout/
│   ├── page.tsx                               # [MODIFY] Listen to Realtime updates
│   └── _components/payment-method-selector.tsx # [MODIFY] Show SePay QR code image
├── backend/
│   ├── src/
│   │   ├── app.module.ts                      # [MODIFY] Register PaymentsModule
│   │   └── modules/
│   │       └── payments/                      # [NEW] Payments Module
│   │           ├── payments.module.ts
│   │           ├── payments.controller.ts
│   │           └── payments.service.ts
│   └── scripts/
│       └── simulate-sepay.ts                  # [NEW] Mock webhook test script
```

## Task Breakdown

### Phase 1: Backend Webhook Endpoint
- **Task 1.1**: Create `payments.module.ts` in NestJS backend.
- **Task 1.2**: Create `payments.controller.ts` exposing `POST /payments/sepay-webhook`. Verify authorization header using custom token validation.
- **Task 1.3**: Create `payments.service.ts` to process SePay webhook payload, fetch booking, verify amount, update booking status, insert payment log.
- **Task 1.4**: Register `PaymentsModule` in `app.module.ts`.

### Phase 2: Frontend QR & Realtime Detection
- **Task 2.1**: Update `payment-method-selector.tsx` to generate SePay Quick Link image URL using the booking code.
- **Task 2.2**: Update `checkout/page.tsx` to:
  1. Insert booking in `pending` status first.
  2. Display the SePay QR code dialog.
  3. Listen to Supabase Realtime changes for that booking ID.
  4. Automatically redirect on successful payment.

### Phase 3: Verification
- **Task 3.1**: Run mock simulation script to verify webhook updates DB.
- **Task 3.2**: Run E2E test to verify frontend detects change and redirects.

---

## Phase X: Final Verification
- [ ] No purple/violet hex codes used.
- [ ] Next.js app builds: `npm run build`
- [ ] NestJS app builds: `npm run build:backend`
- [ ] Webhook validation returns `{"success": true}` on success.
- [ ] Realtime redirect verified.
- [ ] Run checklist.py or verify_all.py scripts.

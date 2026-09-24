# EstateCore CRM — Real Estate & Property Booking Management Platform

An enterprise-grade Real Estate CRM & Property Booking web application built with **Next.js (App Router, TypeScript)**, **Tailwind CSS**, and **PostgreSQL (via Prisma ORM)**. Engineered under strict separation of concerns, DRY principles, resilient ACID concurrency control, and Role-Based Access Control (RBAC).

---

## 🌟 Key Features

- **4-Layer Modular Backend Architecture**: Strict isolation across Data Access Objects (DAO), Service Layer (Business Rules & RBAC scoping), Controllers (Zod Validation & Error Mapping), and App Router Route Handlers.
- **ACID Concurrency & Double-Booking Prevention**: Isolated interactive PostgreSQL transactions (`prisma.$transaction`) enforcing atomic conditional updates (`UPDATE "Unit" SET status = 'BOOKED' WHERE id = :id AND status = 'AVAILABLE'`) with instant HTTP 409 Conflict handling.
- **Multi-Persona Role-Based Access Control (RBAC)**:
  - **Guest / Public**: Browse active properties, filter units, and submit inquiries without exposing internal staff telemetry.
  - **Sales Representative**: Strictly scoped to leads and bookings assigned to their account, preventing unauthorized pipeline inspection or reassignment.
  - **Administrator**: Dedicated user & team management, global visibility over all leads/bookings, representative reassignment, and administrative password resets.
- **Dedicated Team & Users Management (`ADMIN` Exclusive)**:
  - Full CRUD for internal team members.
  - 1-click role toggling (`ADMIN` ⇄ `SALES_REP`).
  - Administrative user password resets with secure `bcrypt` hashing.
  - Relational deletion protections (cannot delete self or users with active assigned leads/bookings).
- **Adaptive Responsive UI**:
  - **Desktop (`md:` and up)**: Full data tables with custom cell rendering, fixed action button widths, and sortable headers.
  - **Mobile (`< md`)**: Automatically adapts into structured, high-density stacked cards to eliminate horizontal scroll fatigue.
  - Zero-scroll dialog patterns leveraging tabbed views and multi-column grids.
- **SVG Design Standardization**: Replaced all legacy emojis with unified, accessible **Lucide SVG** icons across dashboard KPIs, tables, and property cards.
- **Dual-Theme Engine (Light & Dark Mode)**: High-contrast, persistent theme switcher using Tailwind CSS variants with local persistence.
- **Internationalization (i18n)**: Typed dictionary system supporting **English (`en`)**, **Tamil (`ta`)**, and **Hindi (`hi`)** across all navigation, statuses, stages, and actions.
- **Automated E2E Test Suite**: Full Playwright test coverage across all 3 personas, route guards, and business workflows.

---

## 🏗️ Architectural Decisions & Design Rationale

### 1. 4-Layer Backend Domain Isolation

Rather than mixing database calls and business rules inside route handlers, every domain module is isolated under `src/api/[domain]/`:

- **`dao.ts` (Data Access Object)**: Houses pure, parameterized Prisma queries, projection definitions, and relational joins.
- **`service.ts` (Domain Service)**: Orchestrates business rules, RBAC scoping (injecting `session.userId` when role is `SALES_REP`), and transaction boundaries.
- **`controller.ts` (Application Controller)**: Parses and sanitizes input payloads via Zod schemas, extracts auth cookies, and maps domain exceptions to standard HTTP response codes (200, 201, 400, 401, 403, 409, 500).
- **`src/app/api/[domain]/route.ts` (App Router Ingress)**: Extremely thin handlers that delegate directly to controller methods.

### 2. ACID Concurrency Control (Preventing Double Booking)

In high-demand real estate drops, multiple representatives or buyers may attempt to book the same prime unit simultaneously.

**Why not standard read-then-write?**
A typical `findUnique()` followed by `update()` creates a race condition (time-of-check to time-of-use vulnerability) where two concurrent requests read `status = 'AVAILABLE'` and both write `status = 'BOOKED'`.

**Our Solution (`src/api/bookings/dao.ts`)**:

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Conditional atomic update at the database engine level
  const affectedRows = await tx.$executeRaw`
    UPDATE "Unit"
    SET "status" = 'BOOKED'::"UnitStatus", "updatedAt" = NOW()
    WHERE "id" = ${params.unitId} AND "status" = 'AVAILABLE'::"UnitStatus"
  `;

  // 2. Exact match check
  if (affectedRows === 0) {
    throw new ConflictError(
      "Unit is no longer available or already booked by another transaction",
    );
  }

  // 3. Insert Booking audit record & transition Lead stage within same transaction
  const booking = await tx.booking.create({/* ... */});
  await tx.lead.update({
    where: { id: params.leadId },
    data: { stage: "BOOKED" },
  });

  return booking;
});
```

This guarantees that **only one** transaction can transition the unit from `AVAILABLE` to `BOOKED`. Any parallel attempt affects 0 rows and immediately fails with an HTTP 409 Conflict error.

### 3. Exact Lead Lifecycle Stages

Matches real estate sales workflows:
`NEW` ➔ `CONTACTED` ➔ `SITE_VISIT` ➔ `INTERESTED` ➔ `NEGOTIATION` ➔ `BOOKED` (or `LOST`).

---

## 📁 Project Directory Structure

```
├── e2e/                           # Playwright End-to-End Test Matrix
│   ├── 01-guest-user.spec.ts      # Public browsing, property filters & guest boundary guards
│   ├── 02-sales-rep.spec.ts       # Scoped leads, timeline notes & booking flow
│   └── 03-admin-full-crud.spec.ts # Full user directory CRUD, role toggle & audit trails
├── prisma/
│   ├── schema.prisma              # Relational models (User, Project, Building, Unit, Lead, LeadNote, Booking)
│   └── seed.ts                    # Realistic enterprise seed data
├── src/
│   ├── api/                       # 4-Layer Backend Architecture
│   │   ├── auth/                  # controller.ts, service.ts, dao.ts
│   │   ├── users/                 # controller.ts, service.ts, dao.ts (Admin RBAC)
│   │   ├── leads/                 # controller.ts, service.ts, dao.ts
│   │   ├── properties/            # controller.ts, service.ts, dao.ts
│   │   └── bookings/              # controller.ts, service.ts, dao.ts
│   ├── app/
│   │   ├── api/                   # Thin App Router Ingress Endpoints
│   │   │   ├── auth/route.ts
│   │   │   ├── users/route.ts & [id]/route.ts & [id]/reset-password/route.ts
│   │   │   ├── leads/route.ts & [id]/route.ts & [id]/notes/route.ts
│   │   │   ├── properties/route.ts
│   │   │   └── bookings/route.ts
│   │   ├── login/page.tsx         # Staff portal login
│   │   ├── dashboard/page.tsx     # Executive KPIs, pipeline funnel, follow-ups
│   │   ├── users/page.tsx         # Team directory, password reset, role switch (Admin Only)
│   │   ├── leads/page.tsx         # Lifecycle management, search, filters, timeline
│   │   ├── properties/page.tsx    # Project -> Building -> Unit hierarchy & booking modal
│   │   ├── bookings/page.tsx      # Booking audit trail & transaction history
│   │   └── layout.tsx             # Root layout with Theme, Auth, and I18n providers
│   ├── components/
│   │   ├── layout/AppShell.tsx    # Responsive navigation, theme toggle, drawer
│   │   └── ui/                    # Standardized Lucide-based Atomic UI Components
│   │       ├── Button.tsx, Input.tsx, Select.tsx, Card.tsx, Badge.tsx, Modal.tsx, Table.tsx
│   ├── lib/
│   │   ├── auth.ts                # Session token signing/verification (JWT)
│   │   ├── auth-context.tsx       # Client authentication context
│   │   ├── errors.ts              # Domain error classes & response handlers
│   │   ├── prisma.ts              # Resilient Prisma client singleton
│   │   ├── i18n/                  # Typed dictionaries & translations context (en, ta, hi)
│   │   └── theme/                 # Dark/light theme context & local persistence
│   └── models/                    # Zod Validation Schemas & Inferred Types
│       ├── authModel.ts, userModel.ts, leadModel.ts, propertyModel.ts, bookingModel.ts
└── playwright.config.ts           # E2E Test configuration
```

---

## 🚀 Setup & Execution Guide

### 1. Prerequisites

- Node.js 18+ (tested on Node.js 20+)
- PostgreSQL database instance (Supabase, Neon, or local PostgreSQL)

### 2. Installation & Environment Configuration

Clone the repository and install dependencies:

```bash
git clone <your-repository-url>
cd real-estate-crm
npm install
```

Create `.env` file in the root directory:

```ini
DATABASE_URL="postgresql://postgres:password@localhost:5432/realestate_crm?schema=public"
JWT_SECRET="enterprise_crm_super_secret_jwt_key_2026"
```

### 3. Database Synchronization & Seeding

Push the schema to your PostgreSQL database and seed realistic demo records:

```bash
# Push schema tables & enums to database
npx prisma db push

# Populate with Admin, 2 Sales Reps, 2 Projects, 7 Units, 8 Leads, and Bookings
npx prisma db seed
```

### 4. Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Seeded Personas & Credentials

| Role            | Name             | Email                      | Password    | Scope & Permissions                                                 |
| :-------------- | :--------------- | :------------------------- | :---------- | :------------------------------------------------------------------ |
| **Admin**       | Alexander Wright | `admin@realestate.com`     | `Admin@123` | Global pipeline visibility, lead reassignment, all bookings audit.  |
| **Sales Rep 1** | Sarah Jenkins    | `sarah.rep@realestate.com` | `Sales@123` | Scoped strictly to Sarah's assigned leads & bookings.               |
| **Sales Rep 2** | David Miller     | `david.rep@realestate.com` | `Sales@123` | Scoped strictly to David's assigned leads & bookings.               |
| **Guest**       | Unauthenticated  | -                          | -           | Public landing, property catalog browsing, and lead inquiries only. |

---

## 📡 API Endpoints Overview

| Method   | Endpoint                         | Description                                           | Access        |
| :------- | :------------------------------- | :---------------------------------------------------- | :------------ |
| `POST`   | `/api/auth`                      | Authenticate user & set session cookie                | Public        |
| `DELETE` | `/api/auth`                      | Logout & clear session cookie                         | Authenticated |
| `GET`    | `/api/auth`                      | Retrieve current authenticated user profile           | Authenticated |
| `GET`    | `/api/users`                     | List team members with lead/booking counts            | ADMIN Only    |
| `POST`   | `/api/users`                     | Register a new team member                            | ADMIN Only    |
| `PATCH`  | `/api/users/[id]`                | Update team member role (ADMIN / SALES_REP)           | ADMIN Only    |
| `POST`   | `/api/users/[id]/reset-password` | Administrative password reset                         | ADMIN Only    |
| `DELETE` | `/api/users/[id]`                | Delete user (with active relational guards)           | ADMIN Only    |
| `GET`    | `/api/leads`                     | List leads (filtered, search, paginated, RBAC scoped) | Authenticated |
| `POST`   | `/api/leads`                     | Create a new lead inquiry                             | Public / Auth |
| `GET`    | `/api/leads/[id]`                | Get detailed lead profile with interaction notes      | Authenticated |
| `PATCH`  | `/api/leads/[id]`                | Update lead stage or assign representative            | Authenticated |
| `POST`   | `/api/leads/[id]/notes`          | Append timeline interaction note & follow-up date     | Authenticated |
| `GET`    | `/api/properties`                | Fetch hierarchical Project ➔ Building ➔ Unit tree     | Public / Auth |
| `GET`    | `/api/bookings`                  | List booking transactions (RBAC scoped)               | Authenticated |
| `POST`   | `/api/bookings`                  | Execute ACID concurrent unit booking                  | Authenticated |

---

## 🧪 Verification & Automated Testing

**Playwright E2E Test Suite**\
\
The repository includes automated end-to-end tests validating Guest restrictions, Sales Rep operations, and Admin global controls:

```bash
# Run all E2E tests headlessly
npx playwright test

# Run tests in specific user
npx playwright test e2e/01-guest-user.spec.ts
npx playwright test e2e/02-sales-rep.spec.ts
npx playwright test e2e/03-admin-full-crud.spec.ts

```

**TypeScript & Production Build Verification**\

```bash
# Type-check across all backend layers, models, and UI components
npx tsc --noEmit
# Output: Exit code 0 (Zero type errors)

# Production compilation
npm run build
# Output: Compiled successfully (0 build errors)
```

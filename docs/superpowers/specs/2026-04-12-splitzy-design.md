# Splitzy - Design Spec

## Vision

Splitzy helps couples who just moved in together get their finances in order. It lets each person track their own personal expenses while also managing shared costs with their partner. The core problem: when you start living together, you need clarity on who paid what, who owes whom, and whether you're staying within budget — both individually and as a couple.

## Tech Stack

- **Frontend:** Expo (React Native) with Expo Router (file-based navigation)
- **State management:** Zustand
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Backend:** Supabase (Auth, Postgres DB, Realtime)
- **Auth:** Google OAuth via Supabase Auth
- **Platforms:** iOS + Android
- **Currency:** ARS (single currency, no conversions)

## Architecture

```
┌─────────────────────────────┐
│   Expo (React Native)       │
│   Expo Router (file-based)  │
│   Zustand (state)           │
│   NativeWind (estilos)      │
├─────────────────────────────┤
│   Supabase JS Client        │
├─────────────────────────────┤
│   Supabase                  │
│   ├─ Auth (Google OAuth)    │
│   ├─ Postgres DB            │
│   └─ Realtime (sync)       │
└─────────────────────────────┘
```

## Data Model

### profiles
Extends Supabase Auth users.

| Column     | Type        | Notes                              |
|------------|-------------|------------------------------------|
| id         | uuid PK     | FK → auth.users                    |
| name       | text        |                                    |
| avatar_url | text        |                                    |
| partner_id | uuid (null) | FK → profiles, mutual link         |
| created_at | timestamptz |                                    |

### partner_invitations

| Column     | Type        | Notes                              |
|------------|-------------|------------------------------------|
| id         | uuid PK     |                                    |
| inviter_id | uuid        | FK → profiles                      |
| token      | text unique | Used in deep link                  |
| status     | text        | 'pending' / 'accepted' / 'expired' |
| created_at | timestamptz |                                    |
| expires_at | timestamptz |                                    |

### categories

| Column     | Type         | Notes                            |
|------------|--------------|----------------------------------|
| id         | uuid PK      |                                  |
| name       | text         |                                  |
| icon       | text         | Icon name                        |
| is_default | boolean      | Pre-seeded categories            |
| user_id    | uuid (null)  | Null for defaults, FK for custom |

Default categories: Comida, Transporte, Servicios, Entretenimiento, Salud, Hogar, Otros.

### expenses

| Column      | Type        | Notes                                  |
|-------------|-------------|----------------------------------------|
| id          | uuid PK     |                                        |
| user_id     | uuid        | FK → profiles, who registered it       |
| paid_by     | uuid        | FK → profiles, who actually paid       |
| category_id | uuid        | FK → categories                        |
| amount      | numeric     |                                        |
| description | text        |                                        |
| type        | text        | 'personal' / 'shared'                  |
| split_mode  | text        | '50/50' / 'custom', default '50/50'    |
| split_pct   | numeric     | Nullable, percentage if custom split   |
| date        | date        |                                        |
| created_at  | timestamptz |                                        |

### budgets

| Column      | Type        | Notes                        |
|-------------|-------------|------------------------------|
| id          | uuid PK     |                              |
| user_id     | uuid        | FK → profiles                |
| category_id | uuid        | FK → categories              |
| amount      | numeric     | Monthly limit                |
| month       | date        | First day of the month       |
| type        | text        | 'personal' / 'shared'       |

### Balance calculation

The balance between partners is derived, not stored. Query: sum all shared expenses grouped by `paid_by`, compute the difference. Positive = partner owes you, negative = you owe partner.

## Screens & Navigation

### Auth group
- **login** — Google OAuth sign-in

### Tabs (main app)
- **home** — Balance summary with partner + recent expenses
- **expenses** — Full expense list with filters (all / personal / shared)
  - **[id]** — Expense detail
- **add** (center tab, prominent) — New expense form
- **budgets** — Budget progress bars by category
- **profile** — User info, partner linking, settings

### Modals / Stacks
- **invite-partner** — Generate and share invitation link
- **accept-invite** — Deep link handler for accepting partner invitation

### Core user flows

1. **Login:** Google OAuth → auto-create profile if new user
2. **Home:** Shows balance ("Le debés $2.300 a [partner]") + last expenses
3. **Add expense:** Amount → description → category → personal/shared → who paid → save
4. **Partner linking:** Generate link → share via WhatsApp/messages → partner opens link → both profiles linked
5. **Budgets:** Set monthly limits per category, see progress bars

## Partner Linking Flow

1. User A goes to Profile → "Invitar pareja"
2. App generates a unique token, creates a `partner_invitations` row
3. Deep link is generated: `splitzy://invite/{token}`
4. User A shares the link (WhatsApp, messages, etc.)
5. User B opens the link → app handles deep link → shows confirmation
6. On accept: both `profiles.partner_id` point to each other, invitation status → 'accepted'

## Row Level Security (RLS)

- Users can only read/write their own expenses
- Shared expenses are visible to both partners (via partner_id relationship)
- Profiles are readable by the user and their partner
- Invitations are readable by inviter and invitee
- Budgets are only visible to the owner

## MVP Features (v1)

1. Register expenses (amount, description, category, who paid)
2. Mark expense as personal or shared
3. View expense history with filters
4. See balance with partner
5. Expense categories (7 defaults + custom)
6. Monthly budgets per category

## Backlog (post-MVP)

- Charts and statistics
- Push notifications
- Export data (CSV/PDF)
- Multi-currency support
- Recurring expenses

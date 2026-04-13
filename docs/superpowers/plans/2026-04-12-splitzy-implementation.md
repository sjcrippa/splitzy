# Splitzy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile expense-tracking app for couples, with personal/shared expense management, partner linking via invitation links, and monthly budgets.

**Architecture:** Expo (React Native) with file-based routing via Expo Router, Supabase for auth (Google OAuth), Postgres DB, and realtime sync. Zustand for client state, NativeWind for styling.

**Tech Stack:** Expo SDK 55, Expo Router, NativeWind v4, Supabase JS, Zustand, TypeScript

---

## File Structure

```
splitzy/
├── app/
│   ├── _layout.tsx              # Root layout: providers, auth gate
│   ├── (auth)/
│   │   ├── _layout.tsx          # Auth group layout (no tabs)
│   │   └── login.tsx            # Google OAuth login screen
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigator layout
│   │   ├── index.tsx            # Home: balance + recent expenses
│   │   ├── expenses.tsx         # Full expense list with filters
│   │   ├── add.tsx              # Add new expense form
│   │   ├── budgets.tsx          # Budget list with progress bars
│   │   └── profile.tsx          # User profile + partner linking
│   ├── expense/
│   │   └── [id].tsx             # Expense detail screen
│   └── invite/
│       └── [token].tsx          # Accept partner invitation (deep link)
├── components/
│   ├── ExpenseCard.tsx          # Single expense row
│   ├── BalanceSummary.tsx       # Balance widget for home
│   ├── CategoryPicker.tsx      # Category selector modal
│   ├── BudgetBar.tsx           # Single budget progress bar
│   └── EmptyState.tsx          # Empty state placeholder
├── lib/
│   ├── supabase.ts             # Supabase client init
│   ├── types.ts                # TypeScript types for all entities
│   ├── utils.ts                # Currency formatting, date helpers
│   └── store/
│       ├── auth-store.ts       # Auth + profile state
│       ├── expense-store.ts    # Expenses CRUD + filters
│       └── budget-store.ts     # Budgets CRUD
├── constants/
│   └── categories.ts           # Default category definitions
├── global.css                  # NativeWind Tailwind directives
├── tailwind.config.js          # Tailwind config
├── babel.config.js             # Babel with NativeWind preset
├── app.json                    # Expo config with deep linking scheme
└── .env                        # Supabase URL + anon key
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: entire project via `create-expo-app`
- Modify: `package.json`, `babel.config.js`, `app.json`
- Create: `tailwind.config.js`, `global.css`, `nativewind-env.d.ts`

- [ ] **Step 1: Create Expo project**

```bash
cd /Users/santiagocrippa/Desktop/develop/santi/splitzy
npx create-expo-app@latest . --template default@sdk-55
```

If the directory is not empty, move the `docs` folder out temporarily, scaffold, then move it back.

- [ ] **Step 2: Install dependencies**

```bash
npx expo install nativewind react-native-reanimated react-native-safe-area-context
npm install --save-dev tailwindcss@^3.4.17 prettier-plugin-tailwindcss@^0.5.11
npm install @supabase/supabase-js @react-native-async-storage/async-storage
npm install zustand
npm install expo-web-browser expo-auth-session expo-linking expo-secure-store
npm install react-native-url-polyfill
```

- [ ] **Step 3: Create `tailwind.config.js`**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",
        "primary-dark": "#4f46e5",
        secondary: "#f59e0b",
        surface: "#1e1e2e",
        "surface-light": "#2a2a3e",
        background: "#121220",
        danger: "#ef4444",
        success: "#22c55e",
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Create `global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Create `nativewind-env.d.ts`**

```typescript
/// <reference types="nativewind/types" />
```

- [ ] **Step 6: Update `babel.config.js`**

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

- [ ] **Step 7: Update `app.json` — add deep link scheme**

Add the `scheme` field to the expo config:

```json
{
  "expo": {
    "scheme": "splitzy"
  }
}
```

- [ ] **Step 8: Create `.env`**

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

These values will be filled in after the Supabase project is created in Task 2.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Expo project with NativeWind and dependencies"
```

---

## Task 2: Supabase Project & Database Schema

**Files:**
- External: Supabase dashboard / MCP tools
- Modify: `.env` (fill in real values)

This task uses the Supabase MCP tools to create the project and apply migrations.

- [ ] **Step 1: Create Supabase project**

Use `mcp supabase create_project` or create via dashboard. Name: "splitzy". Region: closest to user.

- [ ] **Step 2: Apply migration — create tables**

Apply this migration named `create_schema`:

```sql
-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  avatar_url text,
  partner_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Partner invitations
create table public.partner_invitations (
  id uuid default uuid_generate_v4() primary key,
  inviter_id uuid references public.profiles(id) on delete cascade not null,
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days')
);

-- Categories
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  icon text not null,
  is_default boolean default false,
  user_id uuid references public.profiles(id) on delete cascade
);

-- Expenses
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  paid_by uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) not null,
  amount numeric not null check (amount > 0),
  description text not null,
  type text not null check (type in ('personal', 'shared')),
  split_mode text not null default '50/50' check (split_mode in ('50/50', 'custom')),
  split_pct numeric check (split_pct >= 0 and split_pct <= 100),
  date date not null default current_date,
  created_at timestamptz default now()
);

-- Budgets
create table public.budgets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) not null,
  amount numeric not null check (amount > 0),
  month date not null,
  type text not null check (type in ('personal', 'shared')),
  unique (user_id, category_id, month, type)
);
```

- [ ] **Step 3: Apply migration — seed default categories**

Apply migration named `seed_categories`:

```sql
insert into public.categories (name, icon, is_default) values
  ('Comida', 'restaurant', true),
  ('Transporte', 'directions-car', true),
  ('Servicios', 'receipt', true),
  ('Entretenimiento', 'movie', true),
  ('Salud', 'local-hospital', true),
  ('Hogar', 'home', true),
  ('Otros', 'more-horiz', true);
```

- [ ] **Step 4: Apply migration — RLS policies**

Apply migration named `add_rls_policies`:

```sql
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.partner_invitations enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;

-- Profiles: read own + partner's profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can read partner profile"
  on public.profiles for select
  using (id = (select partner_id from public.profiles where id = auth.uid()));

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Partner invitations
create policy "Users can create invitations"
  on public.partner_invitations for insert
  with check (auth.uid() = inviter_id);

create policy "Users can read own invitations"
  on public.partner_invitations for select
  using (auth.uid() = inviter_id);

create policy "Anyone can read invitation by token"
  on public.partner_invitations for select
  using (true);

create policy "Users can update invitations they received"
  on public.partner_invitations for update
  using (true);

-- Categories: read defaults + own custom categories
create policy "Users can read default categories"
  on public.categories for select
  using (is_default = true);

create policy "Users can read own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can create categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Users can delete own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- Expenses: read/write own + shared with partner
create policy "Users can read own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "Users can read partner shared expenses"
  on public.expenses for select
  using (
    type = 'shared'
    and user_id = (select partner_id from public.profiles where id = auth.uid())
  );

create policy "Users can create expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own expenses"
  on public.expenses for update
  using (auth.uid() = user_id);

create policy "Users can delete own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- Budgets
create policy "Users can read own budgets"
  on public.budgets for select
  using (auth.uid() = user_id);

create policy "Users can create budgets"
  on public.budgets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own budgets"
  on public.budgets for update
  using (auth.uid() = user_id);

create policy "Users can delete own budgets"
  on public.budgets for delete
  using (auth.uid() = user_id);
```

- [ ] **Step 5: Apply migration — auto-create profile on signup**

Apply migration named `create_profile_trigger`:

```sql
-- Function to create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  );
  return new;
end;
$$;

-- Trigger on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 6: Enable Google OAuth in Supabase**

In Supabase Dashboard → Authentication → Providers → Google:
- Enable Google provider
- Set Client ID and Client Secret from Google Cloud Console
- Set redirect URL to `splitzy://` for deep link callback

- [ ] **Step 7: Update `.env` with real Supabase credentials**

Fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from project settings.

- [ ] **Step 8: Commit**

```bash
git add .env
git commit -m "chore: add Supabase environment variables"
```

---

## Task 3: Supabase Client & TypeScript Types

**Files:**
- Create: `lib/supabase.ts`
- Create: `lib/types.ts`
- Create: `lib/utils.ts`
- Create: `constants/categories.ts`

- [ ] **Step 1: Create `lib/supabase.ts`**

```typescript
import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 2: Create `lib/types.ts`**

```typescript
export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  partner_id: string | null;
  created_at: string;
}

export interface PartnerInvitation {
  id: string;
  inviter_id: string;
  token: string;
  status: "pending" | "accepted" | "expired";
  created_at: string;
  expires_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  is_default: boolean;
  user_id: string | null;
}

export interface Expense {
  id: string;
  user_id: string;
  paid_by: string;
  category_id: string;
  amount: number;
  description: string;
  type: "personal" | "shared";
  split_mode: "50/50" | "custom";
  split_pct: number | null;
  date: string;
  created_at: string;
  category?: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  month: string;
  type: "personal" | "shared";
  category?: Category;
}

export type ExpenseFilter = "all" | "personal" | "shared";
```

- [ ] **Step 3: Create `lib/utils.ts`**

```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function getMonthLabel(monthStr: string): string {
  const date = new Date(monthStr + "T00:00:00");
  return date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}
```

- [ ] **Step 4: Create `constants/categories.ts`**

```typescript
import { MaterialIcons } from "@expo/vector-icons";

export const CATEGORY_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  restaurant: "restaurant",
  "directions-car": "directions-car",
  receipt: "receipt",
  movie: "movie",
  "local-hospital": "local-hospital",
  home: "home",
  "more-horiz": "more-horiz",
};
```

- [ ] **Step 5: Commit**

```bash
git add lib/ constants/
git commit -m "feat: add Supabase client, types, and utilities"
```

---

## Task 4: Auth Store & Login Screen

**Files:**
- Create: `lib/store/auth-store.ts`
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(auth)/login.tsx`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Create `lib/store/auth-store.ts`**

```typescript
import { create } from "zustand";
import { supabase } from "../supabase";
import { Profile } from "../types";
import { Session } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  partnerProfile: Profile | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  fetchProfile: () => Promise<void>;
  fetchPartnerProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  partnerProfile: null,
  loading: true,

  setSession: (session) => set({ session, loading: false }),

  fetchProfile: async () => {
    const { session } = get();
    if (!session) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (data) {
      set({ profile: data });
      if (data.partner_id) {
        get().fetchPartnerProfile();
      }
    }
  },

  fetchPartnerProfile: async () => {
    const { profile } = get();
    if (!profile?.partner_id) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profile.partner_id)
      .single();

    if (data) set({ partnerProfile: data });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null, partnerProfile: null });
  },
}));
```

- [ ] **Step 2: Create `app/_layout.tsx` — root layout with auth gate**

```typescript
import "../global.css";
import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../lib/store/auth-store";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const { session, loading, setSession, fetchProfile } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return <Slot />;
}
```

- [ ] **Step 3: Create `app/(auth)/_layout.tsx`**

```typescript
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
```

- [ ] **Step 4: Create `app/(auth)/login.tsx`**

```typescript
import { View, Text, TouchableOpacity, Image } from "react-native";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../../lib/supabase";

WebBrowser.maybeCompleteAuthSession();
const redirectTo = makeRedirectUri();

export default function LoginScreen() {
  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) return;

    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (res.type === "success") {
      const { params } = QueryParams.getQueryParams(res.url);
      const { access_token, refresh_token } = params;
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }
    }
  };

  return (
    <View className="flex-1 bg-background items-center justify-center px-8">
      <Text className="text-5xl font-bold text-primary mb-2">Splitzy</Text>
      <Text className="text-lg text-gray-400 mb-12 text-center">
        Llevá las cuentas con tu pareja, sin dramas.
      </Text>

      <TouchableOpacity
        onPress={handleGoogleLogin}
        className="bg-white flex-row items-center px-6 py-4 rounded-2xl w-full"
      >
        <Image
          source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }}
          className="w-6 h-6 mr-4"
        />
        <Text className="text-gray-800 text-lg font-semibold">
          Continuar con Google
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

- [ ] **Step 5: Verify the app starts and shows the login screen**

```bash
npx expo start
```

Press `i` for iOS simulator or `a` for Android emulator. Confirm the login screen renders.

- [ ] **Step 6: Commit**

```bash
git add lib/store/auth-store.ts app/
git commit -m "feat: add auth flow with Google OAuth login"
```

---

## Task 5: Tab Navigation Layout

**Files:**
- Create: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/index.tsx` (placeholder)
- Create: `app/(tabs)/expenses.tsx` (placeholder)
- Create: `app/(tabs)/add.tsx` (placeholder)
- Create: `app/(tabs)/budgets.tsx` (placeholder)
- Create: `app/(tabs)/profile.tsx` (placeholder)

- [ ] **Step 1: Create `app/(tabs)/_layout.tsx`**

```typescript
import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#121220" },
        headerTintColor: "#fff",
        tabBarStyle: {
          backgroundColor: "#1e1e2e",
          borderTopColor: "#2a2a3e",
        },
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#6b7280",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Gastos",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="add-circle" size={40} color="#6366f1" />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: "Presupuestos",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="pie-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Create placeholder tab screens**

Create each file with a minimal placeholder:

`app/(tabs)/index.tsx`:
```typescript
import { View, Text } from "react-native";

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-white text-xl">Inicio</Text>
    </View>
  );
}
```

`app/(tabs)/expenses.tsx`:
```typescript
import { View, Text } from "react-native";

export default function ExpensesScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-white text-xl">Gastos</Text>
    </View>
  );
}
```

`app/(tabs)/add.tsx`:
```typescript
import { View, Text } from "react-native";

export default function AddExpenseScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-white text-xl">Nuevo Gasto</Text>
    </View>
  );
}
```

`app/(tabs)/budgets.tsx`:
```typescript
import { View, Text } from "react-native";

export default function BudgetsScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-white text-xl">Presupuestos</Text>
    </View>
  );
}
```

`app/(tabs)/profile.tsx`:
```typescript
import { View, Text } from "react-native";

export default function ProfileScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-white text-xl">Perfil</Text>
    </View>
  );
}
```

- [ ] **Step 3: Verify tabs render correctly**

```bash
npx expo start
```

Confirm all 5 tabs render with icons and navigate correctly.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/
git commit -m "feat: add tab navigation with placeholder screens"
```

---

## Task 6: Expense Store & Add Expense Screen

**Files:**
- Create: `lib/store/expense-store.ts`
- Create: `components/CategoryPicker.tsx`
- Modify: `app/(tabs)/add.tsx`

- [ ] **Step 1: Create `lib/store/expense-store.ts`**

```typescript
import { create } from "zustand";
import { supabase } from "../supabase";
import { Expense, ExpenseFilter, Category } from "../types";

interface ExpenseState {
  expenses: Expense[];
  categories: Category[];
  filter: ExpenseFilter;
  loading: boolean;
  setFilter: (filter: ExpenseFilter) => void;
  fetchCategories: () => Promise<void>;
  fetchExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, "id" | "created_at" | "category">) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  categories: [],
  filter: "all",
  loading: false,

  setFilter: (filter) => set({ filter }),

  fetchCategories: async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (data) set({ categories: data });
  },

  fetchExpenses: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from("expenses")
      .select("*, category:categories(*)")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (data) set({ expenses: data });
    set({ loading: false });
  },

  addExpense: async (expense) => {
    const { error } = await supabase.from("expenses").insert(expense);
    if (!error) {
      get().fetchExpenses();
    }
  },

  deleteExpense: async (id) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (!error) {
      set({ expenses: get().expenses.filter((e) => e.id !== id) });
    }
  },
}));
```

- [ ] **Step 2: Create `components/CategoryPicker.tsx`**

```typescript
import { View, Text, TouchableOpacity, Modal, FlatList } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Category } from "../lib/types";

interface CategoryPickerProps {
  categories: Category[];
  selected: string | null;
  onSelect: (id: string) => void;
  visible: boolean;
  onClose: () => void;
}

export default function CategoryPicker({
  categories,
  selected,
  onSelect,
  visible,
  onClose,
}: CategoryPickerProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end">
        <View className="bg-surface rounded-t-3xl p-6 max-h-[60%]">
          <Text className="text-white text-lg font-bold mb-4">Categoría</Text>
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item.id);
                  onClose();
                }}
                className={`flex-row items-center p-4 rounded-xl mb-2 ${
                  selected === item.id ? "bg-primary/20" : "bg-surface-light"
                }`}
              >
                <MaterialIcons
                  name={item.icon as any}
                  size={24}
                  color={selected === item.id ? "#6366f1" : "#9ca3af"}
                />
                <Text
                  className={`ml-3 text-base ${
                    selected === item.id ? "text-primary font-semibold" : "text-gray-300"
                  }`}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity onPress={onClose} className="mt-4 items-center py-3">
            <Text className="text-gray-400 text-base">Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
```

- [ ] **Step 3: Implement `app/(tabs)/add.tsx`**

```typescript
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../lib/store/auth-store";
import { useExpenseStore } from "../../lib/store/expense-store";
import CategoryPicker from "../../components/CategoryPicker";

export default function AddExpenseScreen() {
  const router = useRouter();
  const { profile, partnerProfile } = useAuthStore();
  const { categories, fetchCategories, addExpense } = useExpenseStore();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [type, setType] = useState<"personal" | "shared">("personal");
  const [paidByMe, setPaidByMe] = useState(true);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleSave = async () => {
    if (!amount || !categoryId || !description.trim()) {
      Alert.alert("Error", "Completá todos los campos");
      return;
    }
    if (!profile) return;

    setSaving(true);
    await addExpense({
      user_id: profile.id,
      paid_by: paidByMe ? profile.id : partnerProfile?.id ?? profile.id,
      category_id: categoryId,
      amount: parseFloat(amount),
      description: description.trim(),
      type,
      split_mode: "50/50",
      split_pct: null,
      date: new Date().toISOString().split("T")[0],
    });
    setSaving(false);

    setAmount("");
    setDescription("");
    setCategoryId(null);
    setType("personal");
    setPaidByMe(true);

    router.navigate("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView className="flex-1 px-6 pt-4" keyboardShouldPersistTaps="handled">
        {/* Amount */}
        <Text className="text-gray-400 text-sm mb-2">Monto</Text>
        <View className="flex-row items-center bg-surface rounded-2xl px-4 py-3 mb-6">
          <Text className="text-white text-2xl mr-2">$</Text>
          <TextInput
            className="flex-1 text-white text-3xl font-bold"
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#4b5563"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        {/* Description */}
        <Text className="text-gray-400 text-sm mb-2">Descripción</Text>
        <TextInput
          className="bg-surface text-white text-base rounded-2xl px-4 py-4 mb-6"
          placeholder="Ej: Super del lunes"
          placeholderTextColor="#4b5563"
          value={description}
          onChangeText={setDescription}
        />

        {/* Category */}
        <Text className="text-gray-400 text-sm mb-2">Categoría</Text>
        <TouchableOpacity
          onPress={() => setShowCategoryPicker(true)}
          className="bg-surface flex-row items-center rounded-2xl px-4 py-4 mb-6"
        >
          {selectedCategory ? (
            <>
              <MaterialIcons
                name={selectedCategory.icon as any}
                size={24}
                color="#6366f1"
              />
              <Text className="text-white text-base ml-3">
                {selectedCategory.name}
              </Text>
            </>
          ) : (
            <Text className="text-gray-500 text-base">Elegir categoría</Text>
          )}
        </TouchableOpacity>

        {/* Type toggle */}
        <Text className="text-gray-400 text-sm mb-2">Tipo</Text>
        <View className="flex-row mb-6 gap-3">
          <TouchableOpacity
            onPress={() => setType("personal")}
            className={`flex-1 py-3 rounded-2xl items-center ${
              type === "personal" ? "bg-primary" : "bg-surface"
            }`}
          >
            <Text className={`font-semibold ${type === "personal" ? "text-white" : "text-gray-400"}`}>
              Personal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setType("shared")}
            className={`flex-1 py-3 rounded-2xl items-center ${
              type === "shared" ? "bg-primary" : "bg-surface"
            }`}
          >
            <Text className={`font-semibold ${type === "shared" ? "text-white" : "text-gray-400"}`}>
              Compartido
            </Text>
          </TouchableOpacity>
        </View>

        {/* Paid by (only for shared) */}
        {type === "shared" && partnerProfile && (
          <>
            <Text className="text-gray-400 text-sm mb-2">Pagó</Text>
            <View className="flex-row mb-6 gap-3">
              <TouchableOpacity
                onPress={() => setPaidByMe(true)}
                className={`flex-1 py-3 rounded-2xl items-center ${
                  paidByMe ? "bg-secondary" : "bg-surface"
                }`}
              >
                <Text className={`font-semibold ${paidByMe ? "text-white" : "text-gray-400"}`}>
                  Yo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPaidByMe(false)}
                className={`flex-1 py-3 rounded-2xl items-center ${
                  !paidByMe ? "bg-secondary" : "bg-surface"
                }`}
              >
                <Text className={`font-semibold ${!paidByMe ? "text-white" : "text-gray-400"}`}>
                  {partnerProfile.name || "Pareja"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className={`py-4 rounded-2xl items-center mt-4 ${saving ? "bg-gray-600" : "bg-primary"}`}
        >
          <Text className="text-white text-lg font-bold">
            {saving ? "Guardando..." : "Guardar gasto"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <CategoryPicker
        categories={categories}
        selected={categoryId}
        onSelect={setCategoryId}
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
      />
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 4: Verify adding an expense works end-to-end**

Start the app, log in, go to the "+" tab, fill out the form, and submit. Check Supabase dashboard to confirm the row was created in the `expenses` table.

- [ ] **Step 5: Commit**

```bash
git add lib/store/expense-store.ts components/CategoryPicker.tsx app/(tabs)/add.tsx
git commit -m "feat: add expense creation with category picker"
```

---

## Task 7: Expense List & Detail Screens

**Files:**
- Create: `components/ExpenseCard.tsx`
- Create: `components/EmptyState.tsx`
- Modify: `app/(tabs)/expenses.tsx`
- Create: `app/expense/[id].tsx`

- [ ] **Step 1: Create `components/EmptyState.tsx`**

```typescript
import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
}

export default function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <MaterialIcons name={icon} size={64} color="#4b5563" />
      <Text className="text-gray-400 text-lg font-semibold mt-4">{title}</Text>
      <Text className="text-gray-500 text-sm text-center mt-2">{subtitle}</Text>
    </View>
  );
}
```

- [ ] **Step 2: Create `components/ExpenseCard.tsx`**

```typescript
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Expense } from "../lib/types";
import { formatCurrency, formatDate } from "../lib/utils";
import { useAuthStore } from "../lib/store/auth-store";

interface ExpenseCardProps {
  expense: Expense;
}

export default function ExpenseCard({ expense }: ExpenseCardProps) {
  const router = useRouter();
  const { profile } = useAuthStore();

  const isShared = expense.type === "shared";
  const paidByMe = expense.paid_by === profile?.id;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/expense/${expense.id}`)}
      className="bg-surface rounded-2xl p-4 mb-3 flex-row items-center"
    >
      <View className={`w-12 h-12 rounded-xl items-center justify-center ${isShared ? "bg-primary/20" : "bg-surface-light"}`}>
        <MaterialIcons
          name={(expense.category?.icon as any) ?? "receipt"}
          size={24}
          color={isShared ? "#6366f1" : "#9ca3af"}
        />
      </View>

      <View className="flex-1 ml-3">
        <Text className="text-white font-semibold text-base" numberOfLines={1}>
          {expense.description}
        </Text>
        <View className="flex-row items-center mt-1">
          <Text className="text-gray-500 text-xs">{formatDate(expense.date)}</Text>
          {isShared && (
            <View className="bg-primary/20 rounded-full px-2 py-0.5 ml-2">
              <Text className="text-primary text-xs">compartido</Text>
            </View>
          )}
        </View>
      </View>

      <View className="items-end">
        <Text className="text-white font-bold text-base">
          {formatCurrency(expense.amount)}
        </Text>
        {isShared && (
          <Text className="text-gray-500 text-xs">
            {paidByMe ? "Pagaste vos" : "Pagó tu pareja"}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
```

- [ ] **Step 3: Implement `app/(tabs)/expenses.tsx`**

```typescript
import { useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useExpenseStore } from "../../lib/store/expense-store";
import ExpenseCard from "../../components/ExpenseCard";
import EmptyState from "../../components/EmptyState";
import { ExpenseFilter } from "../../lib/types";

const FILTERS: { key: ExpenseFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "personal", label: "Personales" },
  { key: "shared", label: "Compartidos" },
];

export default function ExpensesScreen() {
  const { expenses, filter, setFilter, fetchExpenses, loading } = useExpenseStore();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const filtered = expenses.filter((e) => {
    if (filter === "all") return true;
    return e.type === filter;
  });

  const onRefresh = useCallback(() => {
    fetchExpenses();
  }, []);

  return (
    <View className="flex-1 bg-background">
      {/* Filter tabs */}
      <View className="flex-row px-4 pt-4 pb-2 gap-2">
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full ${
              filter === f.key ? "bg-primary" : "bg-surface"
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                filter === f.key ? "text-white" : "text-gray-400"
              }`}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Expense list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExpenseCard expense={item} />}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt-long"
            title="Sin gastos"
            subtitle="Tus gastos van a aparecer acá"
          />
        }
      />
    </View>
  );
}
```

- [ ] **Step 4: Create `app/expense/[id].tsx`**

```typescript
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useExpenseStore } from "../../lib/store/expense-store";
import { useAuthStore } from "../../lib/store/auth-store";
import { Expense } from "../../lib/types";
import { formatCurrency, formatDate } from "../../lib/utils";

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile, partnerProfile } = useAuthStore();
  const { deleteExpense } = useExpenseStore();
  const [expense, setExpense] = useState<Expense | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("expenses")
      .select("*, category:categories(*)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) setExpense(data);
      });
  }, [id]);

  const handleDelete = () => {
    Alert.alert("Eliminar gasto", "Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          if (!id) return;
          await deleteExpense(id);
          router.back();
        },
      },
    ]);
  };

  if (!expense) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-gray-400">Cargando...</Text>
      </View>
    );
  }

  const paidByName =
    expense.paid_by === profile?.id
      ? "Vos"
      : partnerProfile?.name || "Tu pareja";

  return (
    <>
      <Stack.Screen
        options={{
          title: "Detalle",
          headerStyle: { backgroundColor: "#121220" },
          headerTintColor: "#fff",
        }}
      />
      <ScrollView className="flex-1 bg-background px-6 pt-6">
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-2xl bg-primary/20 items-center justify-center mb-4">
            <MaterialIcons
              name={(expense.category?.icon as any) ?? "receipt"}
              size={32}
              color="#6366f1"
            />
          </View>
          <Text className="text-white text-3xl font-bold">
            {formatCurrency(expense.amount)}
          </Text>
          <Text className="text-gray-400 text-base mt-1">
            {expense.description}
          </Text>
        </View>

        <View className="bg-surface rounded-2xl p-4 gap-4">
          <DetailRow label="Fecha" value={formatDate(expense.date)} />
          <DetailRow label="Categoría" value={expense.category?.name ?? "—"} />
          <DetailRow
            label="Tipo"
            value={expense.type === "shared" ? "Compartido" : "Personal"}
          />
          {expense.type === "shared" && (
            <>
              <DetailRow label="Pagó" value={paidByName} />
              <DetailRow label="División" value={expense.split_mode} />
            </>
          )}
        </View>

        {expense.user_id === profile?.id && (
          <TouchableOpacity
            onPress={handleDelete}
            className="bg-danger/10 py-4 rounded-2xl items-center mt-6"
          >
            <Text className="text-danger font-semibold text-base">Eliminar gasto</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-gray-500">{label}</Text>
      <Text className="text-white font-medium">{value}</Text>
    </View>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add components/ app/
git commit -m "feat: add expense list with filters and detail screen"
```

---

## Task 8: Home Screen — Balance & Recent Expenses

**Files:**
- Create: `components/BalanceSummary.tsx`
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Create `components/BalanceSummary.tsx`**

```typescript
import { View, Text } from "react-native";
import { useAuthStore } from "../lib/store/auth-store";
import { useExpenseStore } from "../lib/store/expense-store";
import { formatCurrency } from "../lib/utils";

export default function BalanceSummary() {
  const { profile, partnerProfile } = useAuthStore();
  const { expenses } = useExpenseStore();

  if (!profile || !partnerProfile) {
    return (
      <View className="bg-surface rounded-2xl p-6 mx-4 mt-4">
        <Text className="text-gray-400 text-center">
          Vinculá tu pareja desde el perfil para ver el balance
        </Text>
      </View>
    );
  }

  const sharedExpenses = expenses.filter((e) => e.type === "shared");
  const myPaid = sharedExpenses
    .filter((e) => e.paid_by === profile.id)
    .reduce((sum, e) => sum + e.amount, 0);
  const partnerPaid = sharedExpenses
    .filter((e) => e.paid_by === partnerProfile.id)
    .reduce((sum, e) => sum + e.amount, 0);

  // Each person should have paid half of total shared
  const totalShared = myPaid + partnerPaid;
  const fairShare = totalShared / 2;
  const balance = myPaid - fairShare; // positive = partner owes me

  return (
    <View className="bg-surface rounded-2xl p-6 mx-4 mt-4">
      <Text className="text-gray-400 text-sm mb-1">Balance con {partnerProfile.name}</Text>
      {balance === 0 ? (
        <Text className="text-white text-2xl font-bold">Están a mano</Text>
      ) : balance > 0 ? (
        <>
          <Text className="text-success text-2xl font-bold">
            {partnerProfile.name} te debe
          </Text>
          <Text className="text-success text-3xl font-bold mt-1">
            {formatCurrency(balance)}
          </Text>
        </>
      ) : (
        <>
          <Text className="text-secondary text-2xl font-bold">
            Le debés a {partnerProfile.name}
          </Text>
          <Text className="text-secondary text-3xl font-bold mt-1">
            {formatCurrency(Math.abs(balance))}
          </Text>
        </>
      )}

      <View className="flex-row mt-4 gap-4">
        <View className="flex-1 bg-surface-light rounded-xl p-3">
          <Text className="text-gray-500 text-xs">Vos pagaste</Text>
          <Text className="text-white font-bold text-base">{formatCurrency(myPaid)}</Text>
        </View>
        <View className="flex-1 bg-surface-light rounded-xl p-3">
          <Text className="text-gray-500 text-xs">{partnerProfile.name} pagó</Text>
          <Text className="text-white font-bold text-base">{formatCurrency(partnerPaid)}</Text>
        </View>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Implement `app/(tabs)/index.tsx`**

```typescript
import { useEffect, useCallback } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { useAuthStore } from "../../lib/store/auth-store";
import { useExpenseStore } from "../../lib/store/expense-store";
import BalanceSummary from "../../components/BalanceSummary";
import ExpenseCard from "../../components/ExpenseCard";

export default function HomeScreen() {
  const { profile } = useAuthStore();
  const { expenses, fetchExpenses, loading } = useExpenseStore();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const recentExpenses = expenses.slice(0, 10);

  const onRefresh = useCallback(() => {
    fetchExpenses();
  }, []);

  return (
    <FlatList
      className="flex-1 bg-background"
      data={recentExpenses}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View className="px-4">
          <ExpenseCard expense={item} />
        </View>
      )}
      ListHeaderComponent={
        <View>
          <Text className="text-white text-2xl font-bold px-4 pt-4">
            Hola, {profile?.name?.split(" ")[0] ?? ""}
          </Text>
          <BalanceSummary />
          <Text className="text-gray-400 text-sm font-semibold px-4 mt-6 mb-2">
            Últimos gastos
          </Text>
        </View>
      }
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#6366f1" />
      }
    />
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/BalanceSummary.tsx app/(tabs)/index.tsx
git commit -m "feat: add home screen with balance summary and recent expenses"
```

---

## Task 9: Profile Screen & Partner Invitation

**Files:**
- Modify: `app/(tabs)/profile.tsx`
- Create: `app/invite/[token].tsx`

- [ ] **Step 1: Implement `app/(tabs)/profile.tsx`**

```typescript
import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Share,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../lib/store/auth-store";
import { supabase } from "../../lib/supabase";

export default function ProfileScreen() {
  const { profile, partnerProfile, signOut, fetchProfile } = useAuthStore();
  const [inviting, setInviting] = useState(false);

  const handleInvitePartner = async () => {
    if (!profile) return;
    setInviting(true);

    const { data, error } = await supabase
      .from("partner_invitations")
      .insert({ inviter_id: profile.id })
      .select("token")
      .single();

    setInviting(false);

    if (error || !data) {
      Alert.alert("Error", "No se pudo crear la invitación");
      return;
    }

    const link = `splitzy://invite/${data.token}`;

    await Share.share({
      message: `Unite a Splitzy para llevar nuestras cuentas juntos! ${link}`,
    });
  };

  const handleUnlinkPartner = () => {
    Alert.alert("Desvincular pareja", "Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Desvincular",
        style: "destructive",
        onPress: async () => {
          if (!profile) return;
          // Remove both partner links
          await supabase
            .from("profiles")
            .update({ partner_id: null })
            .in("id", [profile.id, profile.partner_id!]);
          fetchProfile();
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background px-6 pt-6">
      {/* Avatar + Name */}
      <View className="items-center mb-8">
        {profile?.avatar_url ? (
          <Image
            source={{ uri: profile.avatar_url }}
            className="w-20 h-20 rounded-full mb-3"
          />
        ) : (
          <View className="w-20 h-20 rounded-full bg-surface items-center justify-center mb-3">
            <MaterialIcons name="person" size={40} color="#6b7280" />
          </View>
        )}
        <Text className="text-white text-xl font-bold">{profile?.name}</Text>
      </View>

      {/* Partner section */}
      <View className="bg-surface rounded-2xl p-4 mb-6">
        <Text className="text-gray-400 text-sm mb-3">Pareja</Text>
        {partnerProfile ? (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              {partnerProfile.avatar_url ? (
                <Image
                  source={{ uri: partnerProfile.avatar_url }}
                  className="w-10 h-10 rounded-full mr-3"
                />
              ) : (
                <View className="w-10 h-10 rounded-full bg-surface-light items-center justify-center mr-3">
                  <MaterialIcons name="person" size={20} color="#6b7280" />
                </View>
              )}
              <Text className="text-white font-semibold">{partnerProfile.name}</Text>
            </View>
            <TouchableOpacity onPress={handleUnlinkPartner}>
              <MaterialIcons name="link-off" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleInvitePartner}
            disabled={inviting}
            className="bg-primary py-3 rounded-xl items-center"
          >
            {inviting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold">Invitar pareja</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Sign out */}
      <TouchableOpacity
        onPress={signOut}
        className="bg-surface py-4 rounded-2xl items-center"
      >
        <Text className="text-danger font-semibold">Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}
```

- [ ] **Step 2: Create `app/invite/[token].tsx`**

```typescript
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../lib/store/auth-store";

export default function AcceptInviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { profile, fetchProfile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [inviterName, setInviterName] = useState("");
  const [inviterId, setInviterId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    const { data: invitation } = await supabase
      .from("partner_invitations")
      .select("*, inviter:profiles!inviter_id(name)")
      .eq("token", token)
      .eq("status", "pending")
      .single();

    setLoading(false);

    if (!invitation) {
      setError("Invitación inválida o expirada");
      return;
    }

    setInviterId(invitation.inviter_id);
    setInviterName((invitation as any).inviter?.name ?? "Alguien");
  };

  const handleAccept = async () => {
    if (!profile || !inviterId) return;

    if (profile.id === inviterId) {
      Alert.alert("Error", "No podés aceptar tu propia invitación");
      return;
    }

    setLoading(true);

    // Link both profiles
    const { error: err1 } = await supabase
      .from("profiles")
      .update({ partner_id: inviterId })
      .eq("id", profile.id);

    const { error: err2 } = await supabase
      .from("profiles")
      .update({ partner_id: profile.id })
      .eq("id", inviterId);

    // Mark invitation as accepted
    await supabase
      .from("partner_invitations")
      .update({ status: "accepted" })
      .eq("token", token);

    setLoading(false);

    if (err1 || err2) {
      Alert.alert("Error", "No se pudo vincular");
      return;
    }

    await fetchProfile();
    Alert.alert("Listo!", `Ahora estás vinculado/a con ${inviterName}`, [
      { text: "OK", onPress: () => router.replace("/(tabs)") },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Invitación",
          headerStyle: { backgroundColor: "#121220" },
          headerTintColor: "#fff",
        }}
      />
      <View className="flex-1 bg-background items-center justify-center px-8">
        {loading ? (
          <ActivityIndicator size="large" color="#6366f1" />
        ) : error ? (
          <>
            <Text className="text-danger text-lg text-center">{error}</Text>
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)")}
              className="mt-6 bg-surface px-6 py-3 rounded-xl"
            >
              <Text className="text-white">Volver</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="text-white text-2xl font-bold text-center mb-4">
              {inviterName} te invitó a Splitzy
            </Text>
            <Text className="text-gray-400 text-center mb-8">
              Aceptá para compartir gastos juntos
            </Text>
            <TouchableOpacity
              onPress={handleAccept}
              className="bg-primary w-full py-4 rounded-2xl items-center"
            >
              <Text className="text-white text-lg font-bold">Aceptar invitación</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/profile.tsx app/invite/
git commit -m "feat: add profile screen and partner invitation flow"
```

---

## Task 10: Budget Store & Budgets Screen

**Files:**
- Create: `lib/store/budget-store.ts`
- Create: `components/BudgetBar.tsx`
- Modify: `app/(tabs)/budgets.tsx`

- [ ] **Step 1: Create `lib/store/budget-store.ts`**

```typescript
import { create } from "zustand";
import { supabase } from "../supabase";
import { Budget } from "../types";
import { getCurrentMonth } from "../utils";

interface BudgetState {
  budgets: Budget[];
  loading: boolean;
  fetchBudgets: () => Promise<void>;
  upsertBudget: (budget: {
    category_id: string;
    amount: number;
    type: "personal" | "shared";
  }) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  loading: false,

  fetchBudgets: async () => {
    set({ loading: true });
    const month = getCurrentMonth();
    const { data } = await supabase
      .from("budgets")
      .select("*, category:categories(*)")
      .eq("month", month);

    if (data) set({ budgets: data });
    set({ loading: false });
  },

  upsertBudget: async ({ category_id, amount, type }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const month = getCurrentMonth();

    const { error } = await supabase.from("budgets").upsert(
      {
        user_id: user.id,
        category_id,
        amount,
        month,
        type,
      },
      { onConflict: "user_id,category_id,month,type" }
    );

    if (!error) get().fetchBudgets();
  },

  deleteBudget: async (id) => {
    await supabase.from("budgets").delete().eq("id", id);
    set({ budgets: get().budgets.filter((b) => b.id !== id) });
  },
}));
```

- [ ] **Step 2: Create `components/BudgetBar.tsx`**

```typescript
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Budget } from "../lib/types";
import { formatCurrency } from "../lib/utils";

interface BudgetBarProps {
  budget: Budget;
  spent: number;
  onDelete: (id: string) => void;
}

export default function BudgetBar({ budget, spent, onDelete }: BudgetBarProps) {
  const pct = Math.min((spent / budget.amount) * 100, 100);
  const over = spent > budget.amount;

  return (
    <View className="bg-surface rounded-2xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <MaterialIcons
            name={(budget.category?.icon as any) ?? "category"}
            size={20}
            color="#9ca3af"
          />
          <Text className="text-white font-semibold ml-2">
            {budget.category?.name}
          </Text>
          <View
            className={`ml-2 px-2 py-0.5 rounded-full ${
              budget.type === "shared" ? "bg-primary/20" : "bg-surface-light"
            }`}
          >
            <Text className="text-xs text-gray-400">{budget.type === "shared" ? "compartido" : "personal"}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => onDelete(budget.id)}>
          <MaterialIcons name="close" size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View className="bg-surface-light rounded-full h-3 mb-2 overflow-hidden">
        <View
          className={`h-3 rounded-full ${over ? "bg-danger" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </View>

      <View className="flex-row justify-between">
        <Text className={`text-sm ${over ? "text-danger" : "text-gray-400"}`}>
          {formatCurrency(spent)} gastado
        </Text>
        <Text className="text-gray-400 text-sm">
          de {formatCurrency(budget.amount)}
        </Text>
      </View>
    </View>
  );
}
```

- [ ] **Step 3: Implement `app/(tabs)/budgets.tsx`**

```typescript
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useBudgetStore } from "../../lib/store/budget-store";
import { useExpenseStore } from "../../lib/store/expense-store";
import BudgetBar from "../../components/BudgetBar";
import CategoryPicker from "../../components/CategoryPicker";
import EmptyState from "../../components/EmptyState";
import { getCurrentMonth } from "../../lib/utils";

export default function BudgetsScreen() {
  const { budgets, fetchBudgets, upsertBudget, deleteBudget } = useBudgetStore();
  const { expenses, categories, fetchCategories, fetchExpenses } = useExpenseStore();

  const [showAdd, setShowAdd] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newCategoryId, setNewCategoryId] = useState<string | null>(null);
  const [newType, setNewType] = useState<"personal" | "shared">("personal");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
    fetchExpenses();
  }, []);

  const currentMonth = getCurrentMonth();

  const getSpent = (categoryId: string, type: "personal" | "shared"): number => {
    return expenses
      .filter(
        (e) =>
          e.category_id === categoryId &&
          e.type === type &&
          e.date.startsWith(currentMonth.slice(0, 7))
      )
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const handleAddBudget = async () => {
    if (!newCategoryId || !newAmount) {
      Alert.alert("Error", "Completá todos los campos");
      return;
    }
    await upsertBudget({
      category_id: newCategoryId,
      amount: parseFloat(newAmount),
      type: newType,
    });
    setShowAdd(false);
    setNewAmount("");
    setNewCategoryId(null);
  };

  const selectedCategory = categories.find((c) => c.id === newCategoryId);

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        renderItem={({ item }) => (
          <BudgetBar
            budget={item}
            spent={getSpent(item.category_id, item.type)}
            onDelete={deleteBudget}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="pie-chart"
            title="Sin presupuestos"
            subtitle="Creá un presupuesto mensual para controlar tus gastos"
          />
        }
        ListFooterComponent={
          <TouchableOpacity
            onPress={() => setShowAdd(true)}
            className="bg-primary/10 border border-primary/30 py-4 rounded-2xl items-center mt-2"
          >
            <Text className="text-primary font-semibold">+ Agregar presupuesto</Text>
          </TouchableOpacity>
        }
      />

      {/* Add budget modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View className="flex-1 justify-end">
          <View className="bg-surface rounded-t-3xl p-6">
            <Text className="text-white text-lg font-bold mb-4">
              Nuevo presupuesto
            </Text>

            <Text className="text-gray-400 text-sm mb-2">Categoría</Text>
            <TouchableOpacity
              onPress={() => setShowCategoryPicker(true)}
              className="bg-surface-light rounded-xl px-4 py-3 mb-4"
            >
              <Text className="text-white">
                {selectedCategory?.name ?? "Elegir categoría"}
              </Text>
            </TouchableOpacity>

            <Text className="text-gray-400 text-sm mb-2">Monto límite</Text>
            <TextInput
              className="bg-surface-light text-white rounded-xl px-4 py-3 mb-4 text-lg"
              keyboardType="numeric"
              placeholder="$0"
              placeholderTextColor="#4b5563"
              value={newAmount}
              onChangeText={setNewAmount}
            />

            <Text className="text-gray-400 text-sm mb-2">Tipo</Text>
            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity
                onPress={() => setNewType("personal")}
                className={`flex-1 py-3 rounded-xl items-center ${
                  newType === "personal" ? "bg-primary" : "bg-surface-light"
                }`}
              >
                <Text className={newType === "personal" ? "text-white font-semibold" : "text-gray-400"}>
                  Personal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNewType("shared")}
                className={`flex-1 py-3 rounded-xl items-center ${
                  newType === "shared" ? "bg-primary" : "bg-surface-light"
                }`}
              >
                <Text className={newType === "shared" ? "text-white font-semibold" : "text-gray-400"}>
                  Compartido
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleAddBudget}
              className="bg-primary py-4 rounded-2xl items-center"
            >
              <Text className="text-white font-bold text-base">Guardar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowAdd(false)}
              className="items-center py-3 mt-2"
            >
              <Text className="text-gray-400">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CategoryPicker
        categories={categories}
        selected={newCategoryId}
        onSelect={setNewCategoryId}
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
      />
    </View>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/store/budget-store.ts components/BudgetBar.tsx app/(tabs)/budgets.tsx
git commit -m "feat: add budgets with progress bars and add-budget modal"
```

---

## Task 11: Realtime Subscription for Shared Expenses

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add realtime subscription to root layout**

Add a new `useEffect` in `app/_layout.tsx` that subscribes to the `expenses` table changes after the session is established:

```typescript
// Add this useEffect after the existing ones in RootLayout
useEffect(() => {
  if (!session) return;

  const channel = supabase
    .channel("expenses-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "expenses" },
      () => {
        // Re-fetch expenses when any change happens
        useExpenseStore.getState().fetchExpenses();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [session]);
```

Add the import at the top of the file:

```typescript
import { useExpenseStore } from "../lib/store/expense-store";
```

- [ ] **Step 2: Enable realtime in Supabase**

In Supabase Dashboard → Database → Publications, ensure the `supabase_realtime` publication includes the `expenses` table. Or run:

```sql
alter publication supabase_realtime add table public.expenses;
```

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: add realtime sync for shared expenses"
```

---

## Task 12: Final Polish & Deep Link Configuration

**Files:**
- Modify: `app.json` (verify scheme)
- Verify all screens work end-to-end

- [ ] **Step 1: Verify `app.json` has the deep link scheme**

Ensure `"scheme": "splitzy"` is present in the expo config.

- [ ] **Step 2: Test full flow end-to-end**

1. Start the app: `npx expo start`
2. Login with Google OAuth
3. Go to Profile → Invite Partner → Share link
4. Add a personal expense
5. Add a shared expense
6. Check Home for balance
7. Check Expenses list with filters
8. Create a budget
9. Verify budget progress bar updates with expenses

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final polish and deep link configuration"
```

---

## Summary

| Task | Description | Dependencies |
|------|-------------|-------------|
| 1 | Project scaffolding (Expo + deps) | None |
| 2 | Supabase project + DB schema + RLS | None |
| 3 | Supabase client + types + utils | Task 1 |
| 4 | Auth store + login screen | Task 1, 3 |
| 5 | Tab navigation layout | Task 4 |
| 6 | Expense store + add expense screen | Task 3, 5 |
| 7 | Expense list + detail screens | Task 6 |
| 8 | Home screen with balance | Task 6, 7 |
| 9 | Profile + partner invitation | Task 4, 5 |
| 10 | Budget store + budgets screen | Task 3, 5, 6 |
| 11 | Realtime subscription | Task 6 |
| 12 | Final polish + E2E test | All |

**Parallelizable:** Tasks 1 and 2 can run in parallel. Tasks 6, 9, and 10 can run in parallel after Task 5 is done.

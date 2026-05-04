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

// --- Obligaciones compartidas ---

export type ObligationType = "fixed" | "variable";
export type Recurrence = "monthly" | "weekly" | "one_time" | "none";
export type SplitMode = "50/50" | "custom";

export interface SharedObligation {
  id: string;
  created_by: string;
  name: string;
  icon: string;
  obligation_type: ObligationType;
  fixed_amount: number | null;
  recurrence: Recurrence;
  split_mode: SplitMode;
  split_pct: number | null;
  is_active: boolean;
  created_at: string;
  payments?: ObligationPayment[];
}

export interface ObligationPayment {
  id: string;
  obligation_id: string;
  paid_by: string;
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
}

export interface ObligationSummary {
  obligation: SharedObligation;
  totalPaid: number;
  myPaid: number;
  partnerPaid: number;
  myShare: number;
  partnerShare: number;
  balance: number; // positive = partner owes me
  progress: number; // 0-1, only meaningful for fixed
}

// --- Plan de gasto semanal ---

export interface SpendingPlan {
  id: string;
  user_id: string;
  month: string;
  monthly_amount: number;
  created_at: string;
}

export interface WeekAllocation {
  weekNumber: number;
  startDay: number;
  endDay: number;
  days: number;
  allocated: number;
  spent: number;
  saved: number;
  status: "completed" | "current" | "upcoming";
}

export interface SpendingPlanSummary {
  plan: SpendingPlan;
  weeks: WeekAllocation[];
  totalSpent: number;
  totalSaved: number;
  currentWeek: WeekAllocation | null;
}

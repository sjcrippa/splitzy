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

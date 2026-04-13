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
    const {
      data: { user },
    } = await supabase.auth.getUser();
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

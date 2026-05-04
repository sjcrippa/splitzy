import { create } from "zustand";
import { supabase } from "../supabase";
import {
  SpendingPlan,
  SpendingPlanSummary,
  WeekAllocation,
  Expense,
} from "../types";
import { getCurrentMonth, getDaysInMonth, getWeeksForMonth } from "../utils";

interface SpendingPlanState {
  plan: SpendingPlan | null;
  loading: boolean;
  fetchPlan: () => Promise<void>;
  upsertPlan: (monthlyAmount: number) => Promise<void>;
  deletePlan: () => Promise<void>;
  getSummary: (personalExpenses: Expense[]) => SpendingPlanSummary | null;
}

export const useSpendingPlanStore = create<SpendingPlanState>((set, get) => ({
  plan: null,
  loading: false,

  fetchPlan: async () => {
    set({ loading: true });
    const month = getCurrentMonth().slice(0, 7); // "YYYY-MM"
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      set({ loading: false });
      return;
    }

    const { data } = await supabase
      .from("spending_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", month)
      .maybeSingle();

    set({ plan: data, loading: false });
  },

  upsertPlan: async (monthlyAmount: number) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const month = getCurrentMonth().slice(0, 7);

    const { error } = await supabase.from("spending_plans").upsert(
      {
        user_id: user.id,
        month,
        monthly_amount: monthlyAmount,
      },
      { onConflict: "user_id,month" }
    );

    if (!error) get().fetchPlan();
  },

  deletePlan: async () => {
    const plan = get().plan;
    if (!plan) return;

    await supabase.from("spending_plans").delete().eq("id", plan.id);
    set({ plan: null });
  },

  getSummary: (personalExpenses: Expense[]): SpendingPlanSummary | null => {
    const plan = get().plan;
    if (!plan) return null;

    const month = plan.month;
    const totalDays = getDaysInMonth(month);
    const weeks = getWeeksForMonth(month);
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

    // Filter expenses for this month
    const monthExpenses = personalExpenses.filter(
      (e) => e.type === "personal" && e.date.startsWith(month)
    );

    const weekAllocations: WeekAllocation[] = weeks.map((w) => {
      const allocated = Math.round(
        (w.days / totalDays) * plan.monthly_amount
      );

      const spent = monthExpenses
        .filter((e) => {
          const day = parseInt(e.date.split("-")[2], 10);
          return day >= w.startDay && day <= w.endDay;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      let status: WeekAllocation["status"];
      if (month < currentMonth) {
        status = "completed";
      } else if (month > currentMonth) {
        status = "upcoming";
      } else if (currentDay > w.endDay) {
        status = "completed";
      } else if (currentDay >= w.startDay && currentDay <= w.endDay) {
        status = "current";
      } else {
        status = "upcoming";
      }

      const saved =
        status === "completed" ? Math.max(0, allocated - spent) : 0;

      return {
        weekNumber: w.weekNumber,
        startDay: w.startDay,
        endDay: w.endDay,
        days: w.days,
        allocated,
        spent,
        saved,
        status,
      };
    });

    const totalSpent = weekAllocations.reduce((sum, w) => sum + w.spent, 0);
    const totalSaved = weekAllocations.reduce((sum, w) => sum + w.saved, 0);
    const currentWeek =
      weekAllocations.find((w) => w.status === "current") ?? null;

    return { plan, weeks: weekAllocations, totalSpent, totalSaved, currentWeek };
  },
}));

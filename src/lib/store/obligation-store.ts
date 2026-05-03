import { create } from "zustand";
import { supabase } from "../supabase";
import {
  SharedObligation,
  ObligationPayment,
  ObligationSummary,
} from "../types";

interface ObligationState {
  obligations: SharedObligation[];
  loading: boolean;
  fetchObligations: () => Promise<void>;
  addObligation: (
    obligation: Omit<SharedObligation, "id" | "created_at" | "payments" | "is_active">
  ) => Promise<void>;
  updateObligation: (
    id: string,
    updates: Partial<Pick<SharedObligation, "name" | "icon" | "fixed_amount" | "split_mode" | "split_pct" | "is_active">>
  ) => Promise<void>;
  deleteObligation: (id: string) => Promise<void>;
  addPayment: (
    payment: Omit<ObligationPayment, "id" | "created_at">
  ) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  getSummary: (
    obligation: SharedObligation,
    myId: string,
    partnerId: string
  ) => ObligationSummary;
}

function getCurrentPeriodPayments(
  payments: ObligationPayment[],
  recurrence: string
): ObligationPayment[] {
  if (!payments.length) return [];

  const now = new Date();

  if (recurrence === "monthly") {
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return payments.filter((p) => p.date.startsWith(prefix));
  }

  if (recurrence === "weekly") {
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return payments.filter((p) => {
      const d = new Date(p.date + "T00:00:00");
      return d >= monday && d <= sunday;
    });
  }

  // one_time / none → all payments count
  return payments;
}

export const useObligationStore = create<ObligationState>((set, get) => ({
  obligations: [],
  loading: false,

  fetchObligations: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from("shared_obligations")
      .select("*, payments:obligation_payments(*)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (data) {
      set({ obligations: data as SharedObligation[] });
    }
    set({ loading: false });
  },

  addObligation: async (obligation) => {
    const { error } = await supabase
      .from("shared_obligations")
      .insert(obligation);
    if (!error) get().fetchObligations();
  },

  updateObligation: async (id, updates) => {
    const { error } = await supabase
      .from("shared_obligations")
      .update(updates)
      .eq("id", id);
    if (!error) get().fetchObligations();
  },

  deleteObligation: async (id) => {
    const { error } = await supabase
      .from("shared_obligations")
      .delete()
      .eq("id", id);
    if (!error) {
      set({ obligations: get().obligations.filter((o) => o.id !== id) });
    }
  },

  addPayment: async (payment) => {
    const { error } = await supabase
      .from("obligation_payments")
      .insert(payment);
    if (!error) get().fetchObligations();
  },

  deletePayment: async (id) => {
    const { error } = await supabase
      .from("obligation_payments")
      .delete()
      .eq("id", id);
    if (!error) get().fetchObligations();
  },

  getSummary: (obligation, myId, partnerId) => {
    const periodPayments = getCurrentPeriodPayments(
      obligation.payments ?? [],
      obligation.recurrence
    );

    const totalPaid = periodPayments.reduce((s, p) => s + p.amount, 0);
    const myPaid = periodPayments
      .filter((p) => p.paid_by === myId)
      .reduce((s, p) => s + p.amount, 0);
    const partnerPaid = periodPayments
      .filter((p) => p.paid_by === partnerId)
      .reduce((s, p) => s + p.amount, 0);

    const splitPct =
      obligation.split_mode === "custom" && obligation.split_pct != null
        ? obligation.split_pct / 100
        : 0.5;

    const base =
      obligation.obligation_type === "fixed"
        ? obligation.fixed_amount ?? 0
        : totalPaid;

    const myShare = base * splitPct;
    const partnerShare = base * (1 - splitPct);

    // positive = partner owes me (I overpaid my share)
    const balance = myPaid - myShare;

    const progress =
      obligation.obligation_type === "fixed" && obligation.fixed_amount
        ? Math.min(totalPaid / obligation.fixed_amount, 1)
        : 0;

    return {
      obligation,
      totalPaid,
      myPaid,
      partnerPaid,
      myShare,
      partnerShare,
      balance,
      progress,
    };
  },
}));

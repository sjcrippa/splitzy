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
  addExpense: (
    expense: Omit<Expense, "id" | "created_at" | "category">
  ) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  categories: [],
  filter: "all",
  loading: false,

  setFilter: (filter) => set({ filter }),

  fetchCategories: async () => {
    const { data, error } = await supabase
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

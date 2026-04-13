import { useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useExpenseStore } from "@/lib/store/expense-store";
import ExpenseCard from "@/components/ExpenseCard";
import EmptyState from "@/components/EmptyState";
import { ExpenseFilter } from "@/lib/types";

const FILTERS: { key: ExpenseFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "personal", label: "Personales" },
  { key: "shared", label: "Compartidos" },
];

export default function ExpensesScreen() {
  const { expenses, filter, setFilter, fetchExpenses, loading } =
    useExpenseStore();

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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExpenseCard expense={item} />}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
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

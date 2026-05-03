import { useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  RefreshControl,
} from "react-native";
import { useExpenseStore } from "@/lib/store/expense-store";
import ExpenseCard from "@/components/ExpenseCard";
import EmptyState from "@/components/EmptyState";

export default function ExpensesScreen() {
  const { expenses, fetchExpenses, loading } = useExpenseStore();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const personalExpenses = expenses.filter((e) => e.type === "personal");

  const onRefresh = useCallback(() => {
    fetchExpenses();
  }, []);

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={personalExpenses}
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
            subtitle="Tus gastos personales van a aparecer acá"
          />
        }
      />
    </View>
  );
}

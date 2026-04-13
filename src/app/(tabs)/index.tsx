import { useEffect, useCallback } from "react";
import { View, Text, FlatList, RefreshControl } from "react-native";
import { useAuthStore } from "@/lib/store/auth-store";
import { useExpenseStore } from "@/lib/store/expense-store";
import BalanceSummary from "@/components/BalanceSummary";
import ExpenseCard from "@/components/ExpenseCard";

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
        <RefreshControl
          refreshing={loading}
          onRefresh={onRefresh}
          tintColor="#6366f1"
        />
      }
    />
  );
}

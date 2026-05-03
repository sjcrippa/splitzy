import { useEffect, useCallback } from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/store/auth-store";
import { useExpenseStore } from "@/lib/store/expense-store";
import { useObligationStore } from "@/lib/store/obligation-store";
import BalanceSummary from "@/components/BalanceSummary";
import ExpenseCard from "@/components/ExpenseCard";
import ObligationCard from "@/components/ObligationCard";

export default function HomeScreen() {
  const router = useRouter();
  const { profile, partnerProfile } = useAuthStore();
  const { expenses, fetchExpenses, loading } = useExpenseStore();
  const { obligations, fetchObligations, getSummary } = useObligationStore();

  useEffect(() => {
    fetchExpenses();
    fetchObligations();
  }, []);

  const personalExpenses = expenses
    .filter((e) => e.type === "personal")
    .slice(0, 8);

  const summaries = obligations.slice(0, 3).map((o) =>
    getSummary(o, profile?.id ?? "", partnerProfile?.id ?? "")
  );

  const onRefresh = useCallback(() => {
    fetchExpenses();
    fetchObligations();
  }, []);

  return (
    <FlatList
      className="flex-1 bg-background"
      data={personalExpenses}
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

          {/* Obligaciones activas */}
          {summaries.length > 0 && (
            <View className="mt-6 px-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-400 text-sm font-semibold">
                  Obligaciones activas
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/obligations")}
                >
                  <Text className="text-primary text-sm">Ver todas</Text>
                </TouchableOpacity>
              </View>
              {summaries.map((s) => (
                <ObligationCard key={s.obligation.id} summary={s} />
              ))}
            </View>
          )}

          <Text className="text-gray-400 text-sm font-semibold px-4 mt-6 mb-2">
            Últimos gastos personales
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

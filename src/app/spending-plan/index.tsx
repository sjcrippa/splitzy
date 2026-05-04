import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSpendingPlanStore } from "@/lib/store/spending-plan-store";
import { useExpenseStore } from "@/lib/store/expense-store";
import { formatCurrency, getMonthLabel, getCurrentMonth } from "@/lib/utils";
import WeekRow from "@/components/WeekRow";
import SetAmountModal from "@/components/SetAmountModal";
import EmptyState from "@/components/EmptyState";
import { Stack } from "expo-router";

export default function SpendingPlanScreen() {
  const { plan, loading, fetchPlan, upsertPlan, getSummary } =
    useSpendingPlanStore();
  const { expenses, fetchExpenses } = useExpenseStore();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPlan();
    fetchExpenses();
  }, []);

  const onRefresh = useCallback(() => {
    fetchPlan();
    fetchExpenses();
  }, []);

  const summary = getSummary(expenses);
  const month = getCurrentMonth().slice(0, 7);
  const monthLabel = getMonthLabel(month + "-01");

  if (!plan && !loading) {
    return (
      <View className="flex-1 bg-background">
        <Stack.Screen options={{ title: "Plan de gasto" }} />
        <EmptyState
          icon="savings"
          title="Sin plan de gasto"
          subtitle="Configura un monto mensual para trackear tus gastos semanales"
        />
        <View className="px-4 pb-8">
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            className="bg-primary py-4 rounded-2xl items-center"
          >
            <Text className="text-white font-bold text-base">
              Configurar plan
            </Text>
          </TouchableOpacity>
        </View>
        <SetAmountModal
          visible={showModal}
          onSave={upsertPlan}
          onClose={() => setShowModal(false)}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ title: "Plan de gasto" }} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-gray-400 text-sm capitalize">
              {monthLabel}
            </Text>
            <Text className="text-white text-2xl font-bold">
              {formatCurrency(plan?.monthly_amount ?? 0)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            className="bg-surface-light p-2 rounded-xl"
          >
            <MaterialIcons name="edit" size={20} color="#6366f1" />
          </TouchableOpacity>
        </View>

        {/* Summary card */}
        {summary && (
          <View className="bg-surface rounded-2xl p-4 mb-4">
            <View className="flex-row gap-3">
              <View className="flex-1 items-center">
                <Text className="text-gray-500 text-xs">Gastado</Text>
                <Text className="text-white font-bold">
                  {formatCurrency(summary.totalSpent)}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-gray-500 text-xs">Ahorrado</Text>
                <Text className="text-success font-bold">
                  {formatCurrency(summary.totalSaved)}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-gray-500 text-xs">Restante</Text>
                <Text className="text-primary font-bold">
                  {formatCurrency(
                    Math.max(0, (plan?.monthly_amount ?? 0) - summary.totalSpent)
                  )}
                </Text>
              </View>
            </View>

            {/* Monthly progress bar */}
            <View className="h-2 bg-gray-700 rounded-full mt-4">
              <View
                className="h-2 bg-primary rounded-full"
                style={{
                  width: `${Math.min(100, (summary.totalSpent / (plan?.monthly_amount ?? 1)) * 100)}%`,
                }}
              />
            </View>
          </View>
        )}

        {/* Week list */}
        <Text className="text-gray-400 text-sm font-semibold mb-3">
          Semanas
        </Text>
        {summary?.weeks.map((w) => (
          <WeekRow key={w.weekNumber} week={w} monthStr={month} />
        ))}

        {/* Savings card */}
        {summary && summary.totalSaved > 0 && (
          <View className="bg-surface rounded-2xl p-4 mt-2 flex-row items-center">
            <MaterialIcons name="trending-up" size={24} color="#10b981" />
            <View className="ml-3">
              <Text className="text-success font-bold text-lg">
                {formatCurrency(summary.totalSaved)}
              </Text>
              <Text className="text-gray-400 text-xs">
                Ahorro acumulado de semanas completadas
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <SetAmountModal
        visible={showModal}
        currentAmount={plan?.monthly_amount}
        onSave={upsertPlan}
        onClose={() => setShowModal(false)}
      />
    </View>
  );
}

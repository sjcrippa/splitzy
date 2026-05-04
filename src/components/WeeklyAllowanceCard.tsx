import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SpendingPlanSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface WeeklyAllowanceCardProps {
  summary: SpendingPlanSummary | null;
}

export default function WeeklyAllowanceCard({
  summary,
}: WeeklyAllowanceCardProps) {
  const router = useRouter();

  if (!summary) {
    return (
      <TouchableOpacity
        onPress={() => router.push("/spending-plan")}
        className="bg-surface rounded-2xl p-6 mx-4 mt-4"
      >
        <View className="flex-row items-center">
          <MaterialIcons name="savings" size={24} color="#6366f1" />
          <View className="ml-3 flex-1">
            <Text className="text-white font-semibold">
              Configurar plan de gasto
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              Controla cuanto gastas por semana
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#4b5563" />
        </View>
      </TouchableOpacity>
    );
  }

  const { currentWeek, totalSaved } = summary;
  const available = currentWeek
    ? Math.max(0, currentWeek.allocated - currentWeek.spent)
    : 0;
  const progress = currentWeek && currentWeek.allocated > 0
    ? Math.min(currentWeek.spent / currentWeek.allocated, 1)
    : 0;
  const isOverspent = currentWeek
    ? currentWeek.spent > currentWeek.allocated
    : false;

  return (
    <TouchableOpacity
      onPress={() => router.push("/spending-plan")}
      className="bg-surface rounded-2xl p-6 mx-4 mt-4"
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <MaterialIcons name="savings" size={20} color="#6366f1" />
          <Text className="text-gray-400 text-sm ml-2">
            Semana {currentWeek?.weekNumber ?? "-"}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color="#4b5563" />
      </View>

      {currentWeek && (
        <>
          <Text
            className={`text-2xl font-bold ${isOverspent ? "text-red-400" : "text-white"}`}
          >
            {isOverspent
              ? `Excedido ${formatCurrency(currentWeek.spent - currentWeek.allocated)}`
              : `${formatCurrency(available)} disponible`}
          </Text>

          <View className="h-2 bg-gray-700 rounded-full mt-3">
            <View
              className={`h-2 rounded-full ${isOverspent ? "bg-red-500" : "bg-primary"}`}
              style={{ width: `${progress * 100}%` }}
            />
          </View>

          <View className="flex-row justify-between mt-2">
            <Text className="text-gray-500 text-xs">
              {formatCurrency(currentWeek.spent)} gastado
            </Text>
            <Text className="text-gray-500 text-xs">
              {formatCurrency(currentWeek.allocated)} asignado
            </Text>
          </View>
        </>
      )}

      {totalSaved > 0 && (
        <View className="flex-row items-center mt-3 pt-3 border-t border-gray-700">
          <MaterialIcons name="trending-up" size={16} color="#10b981" />
          <Text className="text-success text-sm ml-1">
            {formatCurrency(totalSaved)} ahorrado
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

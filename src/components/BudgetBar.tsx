import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Budget } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface BudgetBarProps {
  budget: Budget;
  spent: number;
  onDelete: (id: string) => void;
}

export default function BudgetBar({ budget, spent, onDelete }: BudgetBarProps) {
  const pct = Math.min((spent / budget.amount) * 100, 100);
  const over = spent > budget.amount;

  return (
    <View className="bg-surface rounded-2xl p-4 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <MaterialIcons
            name={(budget.category?.icon as any) ?? "category"}
            size={20}
            color="#9ca3af"
          />
          <Text className="text-white font-semibold ml-2">
            {budget.category?.name}
          </Text>
          <View
            className={`ml-2 px-2 py-0.5 rounded-full ${
              budget.type === "shared" ? "bg-primary/20" : "bg-surface-light"
            }`}
          >
            <Text className="text-xs text-gray-400">
              {budget.type === "shared" ? "compartido" : "personal"}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => onDelete(budget.id)}>
          <MaterialIcons name="close" size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <View className="bg-surface-light rounded-full h-3 mb-2 overflow-hidden">
        <View
          className={`h-3 rounded-full ${over ? "bg-danger" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </View>

      <View className="flex-row justify-between">
        <Text className={`text-sm ${over ? "text-danger" : "text-gray-400"}`}>
          {formatCurrency(spent)} gastado
        </Text>
        <Text className="text-gray-400 text-sm">
          de {formatCurrency(budget.amount)}
        </Text>
      </View>
    </View>
  );
}

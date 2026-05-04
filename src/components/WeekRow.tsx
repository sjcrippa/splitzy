import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { WeekAllocation } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface WeekRowProps {
  week: WeekAllocation;
  monthStr: string;
}

export default function WeekRow({ week, monthStr }: WeekRowProps) {
  const progress = week.allocated > 0 ? Math.min(week.spent / week.allocated, 1) : 0;
  const isOverspent = week.spent > week.allocated;

  const statusIcon =
    week.status === "completed"
      ? "check-circle"
      : week.status === "current"
        ? "radio-button-checked"
        : "radio-button-unchecked";

  const statusColor =
    week.status === "completed"
      ? "#10b981"
      : week.status === "current"
        ? "#6366f1"
        : "#4b5563";

  const [year, month] = monthStr.split("-").map(Number);
  const startLabel = `${week.startDay}/${month}`;
  const endLabel = `${week.endDay}/${month}`;

  return (
    <View className="bg-surface-light rounded-xl p-4 mb-3">
      <View className="flex-row items-center mb-2">
        <MaterialIcons name={statusIcon} size={18} color={statusColor} />
        <Text className="text-white font-semibold ml-2">
          Semana {week.weekNumber}
        </Text>
        <Text className="text-gray-500 text-xs ml-2">
          {startLabel} - {endLabel}
        </Text>
      </View>

      {/* Progress bar */}
      <View className="h-2 bg-gray-700 rounded-full mb-2">
        <View
          className={`h-2 rounded-full ${isOverspent ? "bg-red-500" : "bg-primary"}`}
          style={{ width: `${progress * 100}%` }}
        />
      </View>

      <View className="flex-row justify-between">
        <Text className="text-gray-400 text-xs">
          Gastado: {formatCurrency(week.spent)}
        </Text>
        {week.status === "completed" ? (
          week.saved > 0 ? (
            <Text className="text-success text-xs font-semibold">
              Ahorro: {formatCurrency(week.saved)}
            </Text>
          ) : (
            <Text className="text-red-400 text-xs font-semibold">
              Excedido {formatCurrency(week.spent - week.allocated)}
            </Text>
          )
        ) : (
          <Text className="text-gray-400 text-xs">
            Disponible: {formatCurrency(Math.max(0, week.allocated - week.spent))}
          </Text>
        )}
      </View>
      <Text className="text-gray-500 text-xs mt-1">
        Asignado: {formatCurrency(week.allocated)}
      </Text>
    </View>
  );
}

import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ObligationSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface ObligationCardProps {
  summary: ObligationSummary;
}

export default function ObligationCard({ summary }: ObligationCardProps) {
  const router = useRouter();
  const { obligation, totalPaid, progress, balance } = summary;
  const isFixed = obligation.obligation_type === "fixed";

  return (
    <TouchableOpacity
      onPress={() => router.push(`/obligation/${obligation.id}`)}
      className="bg-surface rounded-2xl p-4 mb-3"
    >
      <View className="flex-row items-center">
        <View className="w-12 h-12 rounded-xl bg-primary/20 items-center justify-center">
          <MaterialIcons
            name={obligation.icon as any}
            size={24}
            color="#6366f1"
          />
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-white font-semibold text-base">
            {obligation.name}
          </Text>
          <Text className="text-gray-500 text-xs mt-0.5">
            {obligation.split_mode === "50/50"
              ? "50/50"
              : `${obligation.split_pct}/${100 - (obligation.split_pct ?? 50)}`}
            {" \u00B7 "}
            {obligation.recurrence === "monthly"
              ? "Mensual"
              : obligation.recurrence === "weekly"
                ? "Semanal"
                : obligation.recurrence === "one_time"
                  ? "Una vez"
                  : "Sin recurrencia"}
          </Text>
        </View>
        <View className="items-end">
          {isFixed ? (
            <Text className="text-white font-bold text-base">
              {formatCurrency(obligation.fixed_amount ?? 0)}
            </Text>
          ) : (
            <Text className="text-white font-bold text-base">
              {formatCurrency(totalPaid)}
            </Text>
          )}
          {isFixed && (
            <Text className="text-gray-500 text-xs">
              {Math.round(progress * 100)}% cubierto
            </Text>
          )}
        </View>
      </View>

      {isFixed && (
        <View className="mt-3 bg-surface-light rounded-full h-2 overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${Math.round(progress * 100)}%`,
              backgroundColor: progress >= 1 ? "#22c55e" : "#6366f1",
            }}
          />
        </View>
      )}

      {balance !== 0 && (
        <Text
          className={`text-xs mt-2 ${balance > 0 ? "text-success" : "text-secondary"}`}
        >
          {balance > 0
            ? `Te deben ${formatCurrency(balance)}`
            : `Debés ${formatCurrency(Math.abs(balance))}`}
        </Text>
      )}
    </TouchableOpacity>
  );
}

import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Expense } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/auth-store";

interface ExpenseCardProps {
  expense: Expense;
}

export default function ExpenseCard({ expense }: ExpenseCardProps) {
  const router = useRouter();
  const { profile } = useAuthStore();

  const isShared = expense.type === "shared";
  const paidByMe = expense.paid_by === profile?.id;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/expense/${expense.id}`)}
      className="bg-surface rounded-2xl p-4 mb-3 flex-row items-center"
    >
      <View
        className={`w-12 h-12 rounded-xl items-center justify-center ${
          isShared ? "bg-primary/20" : "bg-surface-light"
        }`}
      >
        <MaterialIcons
          name={(expense.category?.icon as any) ?? "receipt"}
          size={24}
          color={isShared ? "#6366f1" : "#9ca3af"}
        />
      </View>

      <View className="flex-1 ml-3">
        <Text className="text-white font-semibold text-base" numberOfLines={1}>
          {expense.description}
        </Text>
        <View className="flex-row items-center mt-1">
          <Text className="text-gray-500 text-xs">
            {formatDate(expense.date)}
          </Text>
          {isShared && (
            <View className="bg-primary/20 rounded-full px-2 py-0.5 ml-2">
              <Text className="text-primary text-xs">compartido</Text>
            </View>
          )}
        </View>
      </View>

      <View className="items-end">
        <Text className="text-white font-bold text-base">
          {formatCurrency(expense.amount)}
        </Text>
        {isShared && (
          <Text className="text-gray-500 text-xs">
            {paidByMe ? "Pagaste vos" : "Pagó tu pareja"}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

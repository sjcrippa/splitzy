import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useExpenseStore } from "@/lib/store/expense-store";
import { useAuthStore } from "@/lib/store/auth-store";
import { Expense } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile, partnerProfile } = useAuthStore();
  const { deleteExpense } = useExpenseStore();
  const [expense, setExpense] = useState<Expense | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("expenses")
      .select("*, category:categories(*)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) setExpense(data);
      });
  }, [id]);

  const handleDelete = () => {
    Alert.alert("Eliminar gasto", "Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          if (!id) return;
          await deleteExpense(id);
          router.back();
        },
      },
    ]);
  };

  if (!expense) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-gray-400">Cargando...</Text>
      </View>
    );
  }

  const paidByName =
    expense.paid_by === profile?.id
      ? "Vos"
      : partnerProfile?.name || "Tu pareja";

  return (
    <>
      <Stack.Screen
        options={{
          title: "Detalle",
          headerStyle: { backgroundColor: "#121220" },
          headerTintColor: "#fff",
        }}
      />
      <ScrollView className="flex-1 bg-background px-6 pt-6">
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-2xl bg-primary/20 items-center justify-center mb-4">
            <MaterialIcons
              name={(expense.category?.icon as any) ?? "receipt"}
              size={32}
              color="#6366f1"
            />
          </View>
          <Text className="text-white text-3xl font-bold">
            {formatCurrency(expense.amount)}
          </Text>
          <Text className="text-gray-400 text-base mt-1">
            {expense.description}
          </Text>
        </View>

        <View className="bg-surface rounded-2xl p-4 gap-4">
          <DetailRow label="Fecha" value={formatDate(expense.date)} />
          <DetailRow
            label="Categoría"
            value={expense.category?.name ?? "—"}
          />
          <DetailRow
            label="Tipo"
            value={expense.type === "shared" ? "Compartido" : "Personal"}
          />
          {expense.type === "shared" && (
            <>
              <DetailRow label="Pagó" value={paidByName} />
              <DetailRow label="División" value={expense.split_mode} />
            </>
          )}
        </View>

        {expense.user_id === profile?.id && (
          <TouchableOpacity
            onPress={handleDelete}
            className="bg-danger/10 py-4 rounded-2xl items-center mt-6"
          >
            <Text className="text-danger font-semibold text-base">
              Eliminar gasto
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-gray-500">{label}</Text>
      <Text className="text-white font-medium">{value}</Text>
    </View>
  );
}

import { useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/store/auth-store";
import { useObligationStore } from "@/lib/store/obligation-store";
import PaymentCard from "@/components/PaymentCard";
import EmptyState from "@/components/EmptyState";
import { formatCurrency } from "@/lib/utils";

export default function ObligationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile, partnerProfile } = useAuthStore();
  const {
    obligations,
    loading,
    fetchObligations,
    deletePayment,
    updateObligation,
  } = useObligationStore();
  const { getSummary } = useObligationStore();

  useEffect(() => {
    fetchObligations();
  }, []);

  const obligation = obligations.find((o) => o.id === id);

  const onRefresh = useCallback(() => {
    fetchObligations();
  }, []);

  if (!obligation) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-gray-400">Cargando...</Text>
      </View>
    );
  }

  const summary = getSummary(
    obligation,
    profile?.id ?? "",
    partnerProfile?.id ?? ""
  );

  const payments = [...(obligation.payments ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const isFixed = obligation.obligation_type === "fixed";

  const handleArchive = () => {
    Alert.alert("Archivar", `Archivar "${obligation.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Archivar",
        onPress: async () => {
          await updateObligation(obligation.id, { is_active: false });
          router.back();
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: obligation.name,
          headerStyle: { backgroundColor: "#121220" },
          headerTintColor: "#fff",
          headerRight: () => (
            <TouchableOpacity onPress={handleArchive} className="mr-2">
              <MaterialIcons name="archive" size={24} color="#6b7280" />
            </TouchableOpacity>
          ),
        }}
      />

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        renderItem={({ item }) => (
          <PaymentCard payment={item} onDelete={deletePayment} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
        ListHeaderComponent={
          <View className="mb-4">
            {/* Summary card */}
            <View className="bg-surface rounded-2xl p-6 mb-4">
              <View className="flex-row items-center mb-4">
                <View className="w-14 h-14 rounded-xl bg-primary/20 items-center justify-center">
                  <MaterialIcons
                    name={obligation.icon as any}
                    size={28}
                    color="#6366f1"
                  />
                </View>
                <View className="ml-4">
                  <Text className="text-white text-xl font-bold">
                    {obligation.name}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {obligation.split_mode === "50/50"
                      ? "50/50"
                      : `${obligation.split_pct}/${100 - (obligation.split_pct ?? 50)}`}
                    {" \u00B7 "}
                    {isFixed
                      ? formatCurrency(obligation.fixed_amount ?? 0)
                      : "Variable"}
                  </Text>
                </View>
              </View>

              {/* Progress bar for fixed */}
              {isFixed && (
                <View className="mb-4">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-gray-400 text-sm">Progreso</Text>
                    <Text className="text-white text-sm font-semibold">
                      {formatCurrency(summary.totalPaid)} /{" "}
                      {formatCurrency(obligation.fixed_amount ?? 0)}
                    </Text>
                  </View>
                  <View className="bg-surface-light rounded-full h-3 overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round(summary.progress * 100)}%`,
                        backgroundColor:
                          summary.progress >= 1 ? "#22c55e" : "#6366f1",
                      }}
                    />
                  </View>
                </View>
              )}

              {/* Balance */}
              <View className="flex-row gap-3">
                <View className="flex-1 bg-surface-light rounded-xl p-3">
                  <Text className="text-gray-500 text-xs">Vos pagaste</Text>
                  <Text className="text-white font-bold text-base">
                    {formatCurrency(summary.myPaid)}
                  </Text>
                </View>
                <View className="flex-1 bg-surface-light rounded-xl p-3">
                  <Text className="text-gray-500 text-xs">
                    {partnerProfile?.name ?? "Pareja"} pagó
                  </Text>
                  <Text className="text-white font-bold text-base">
                    {formatCurrency(summary.partnerPaid)}
                  </Text>
                </View>
              </View>

              {summary.balance !== 0 && (
                <View
                  className={`mt-3 rounded-xl p-3 ${
                    summary.balance > 0 ? "bg-success/10" : "bg-secondary/10"
                  }`}
                >
                  <Text
                    className={`text-center font-semibold ${
                      summary.balance > 0 ? "text-success" : "text-secondary"
                    }`}
                  >
                    {summary.balance > 0
                      ? `${partnerProfile?.name ?? "Pareja"} te debe ${formatCurrency(summary.balance)}`
                      : `Le debés ${formatCurrency(Math.abs(summary.balance))} a ${partnerProfile?.name ?? "Pareja"}`}
                  </Text>
                </View>
              )}

              {summary.balance === 0 && summary.totalPaid > 0 && (
                <View className="mt-3 rounded-xl p-3 bg-surface-light">
                  <Text className="text-center font-semibold text-white">
                    Están a mano
                  </Text>
                </View>
              )}
            </View>

            {/* Payments header */}
            <Text className="text-gray-400 text-sm font-semibold mb-2">
              Pagos del período
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="payment"
            title="Sin pagos"
            subtitle="Agregá un pago a esta obligación"
          />
        }
      />

      {/* FAB to add payment */}
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/obligation/add-payment",
            params: { obligationId: obligation.id },
          })
        }
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#6366f1",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#6366f1",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

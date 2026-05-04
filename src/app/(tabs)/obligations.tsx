import { useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import type { ObligationFilter } from "@/lib/types";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/store/auth-store";
import { useObligationStore } from "@/lib/store/obligation-store";
import ObligationCard from "@/components/ObligationCard";
import EmptyState from "@/components/EmptyState";

export default function ObligationsScreen() {
  const router = useRouter();
  const { profile, partnerProfile } = useAuthStore();
  const { loading, fetchObligations, getSummary, filter, setFilter, getFilteredObligations } =
    useObligationStore();

  useEffect(() => {
    fetchObligations();
  }, []);

  const onRefresh = useCallback(() => {
    fetchObligations();
  }, []);

  const filtered = getFilteredObligations();
  const summaries = filtered.map((o) =>
    getSummary(o, profile?.id ?? "", partnerProfile?.id ?? "")
  );

  const FILTERS: { key: ObligationFilter; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "shared", label: "Compartidas" },
    { key: "personal", label: "Personales" },
  ];

  const emptySubtitle =
    filter === "personal"
      ? "No tenés obligaciones personales"
      : filter === "shared"
        ? "No tenés obligaciones compartidas"
        : "Creá una obligación compartida o personal";

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={summaries}
        keyExtractor={(item) => item.obligation.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        renderItem={({ item }) => <ObligationCard summary={item} />}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
        ListHeaderComponent={
          <View className="flex-row gap-2 mb-4">
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-full ${
                  filter === f.key ? "bg-primary" : "bg-surface"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    filter === f.key ? "text-white" : "text-gray-400"
                  }`}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="handshake"
            title="Sin obligaciones"
            subtitle={emptySubtitle}
          />
        }
        ListFooterComponent={
          <TouchableOpacity
            onPress={() => router.push("/obligation/create")}
            className="bg-primary/10 border border-primary/30 py-4 rounded-2xl items-center mt-2"
          >
            <Text className="text-primary font-semibold">
              + Nueva obligación
            </Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

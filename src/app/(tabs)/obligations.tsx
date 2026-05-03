import { useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/store/auth-store";
import { useObligationStore } from "@/lib/store/obligation-store";
import ObligationCard from "@/components/ObligationCard";
import EmptyState from "@/components/EmptyState";

export default function ObligationsScreen() {
  const router = useRouter();
  const { profile, partnerProfile } = useAuthStore();
  const { obligations, loading, fetchObligations, getSummary } =
    useObligationStore();

  useEffect(() => {
    fetchObligations();
  }, []);

  const onRefresh = useCallback(() => {
    fetchObligations();
  }, []);

  const summaries = obligations.map((o) =>
    getSummary(o, profile?.id ?? "", partnerProfile?.id ?? "")
  );

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
        ListEmptyComponent={
          <EmptyState
            icon="handshake"
            title="Sin obligaciones"
            subtitle="Creá una obligación compartida con tu pareja"
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

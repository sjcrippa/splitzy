import "@/global.css";
import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/store/auth-store";
import { useExpenseStore } from "@/lib/store/expense-store";
import { useObligationStore } from "@/lib/store/obligation-store";

export default function RootLayout() {
  const { session, loading, setSession, fetchProfile } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session]);

  // Realtime subscription for expenses
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel("expenses-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        () => {
          useExpenseStore.getState().fetchExpenses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  // Realtime subscriptions for obligations
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel("obligations-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shared_obligations" },
        () => {
          useObligationStore.getState().fetchObligations();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "obligation_payments" },
        () => {
          useObligationStore.getState().fetchObligations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return <Slot />;
}

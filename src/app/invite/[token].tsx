import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/store/auth-store";

export default function AcceptInviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { profile, fetchProfile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [inviterName, setInviterName] = useState("");
  const [inviterId, setInviterId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    const { data: invitation } = await supabase
      .from("partner_invitations")
      .select("*, inviter:profiles!inviter_id(name)")
      .eq("token", token)
      .eq("status", "pending")
      .single();

    setLoading(false);

    if (!invitation) {
      setError("Invitación inválida o expirada");
      return;
    }

    setInviterId(invitation.inviter_id);
    setInviterName((invitation as any).inviter?.name ?? "Alguien");
  };

  const handleAccept = async () => {
    if (!profile || !inviterId) return;

    if (profile.id === inviterId) {
      Alert.alert("Error", "No podés aceptar tu propia invitación");
      return;
    }

    setLoading(true);

    const { error: err1 } = await supabase
      .from("profiles")
      .update({ partner_id: inviterId })
      .eq("id", profile.id);

    const { error: err2 } = await supabase
      .from("profiles")
      .update({ partner_id: profile.id })
      .eq("id", inviterId);

    await supabase
      .from("partner_invitations")
      .update({ status: "accepted" })
      .eq("token", token);

    setLoading(false);

    if (err1 || err2) {
      Alert.alert("Error", "No se pudo vincular");
      return;
    }

    await fetchProfile();
    Alert.alert("Listo!", `Ahora estás vinculado/a con ${inviterName}`, [
      { text: "OK", onPress: () => router.replace("/(tabs)") },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Invitación",
          headerStyle: { backgroundColor: "#121220" },
          headerTintColor: "#fff",
        }}
      />
      <View className="flex-1 bg-background items-center justify-center px-8">
        {loading ? (
          <ActivityIndicator size="large" color="#6366f1" />
        ) : error ? (
          <>
            <Text className="text-danger text-lg text-center">{error}</Text>
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)")}
              className="mt-6 bg-surface px-6 py-3 rounded-xl"
            >
              <Text className="text-white">Volver</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="text-white text-2xl font-bold text-center mb-4">
              {inviterName} te invitó a Splitzy
            </Text>
            <Text className="text-gray-400 text-center mb-8">
              Aceptá para compartir gastos juntos
            </Text>
            <TouchableOpacity
              onPress={handleAccept}
              className="bg-primary w-full py-4 rounded-2xl items-center"
            >
              <Text className="text-white text-lg font-bold">
                Aceptar invitación
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </>
  );
}

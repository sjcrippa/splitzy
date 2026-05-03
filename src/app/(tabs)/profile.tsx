import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { MaterialIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useAuthStore } from "@/lib/store/auth-store";
import { supabase } from "@/lib/supabase";

export default function ProfileScreen() {
  const { profile, partnerProfile, signOut, fetchProfile } = useAuthStore();
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInvitePartner = async () => {
    if (!profile) return;
    setInviting(true);

    const { data, error } = await supabase
      .from("partner_invitations")
      .insert({ inviter_id: profile.id })
      .select("token")
      .single();

    setInviting(false);

    if (error || !data) {
      Alert.alert("Error", "No se pudo crear la invitación");
      return;
    }

    setInviteLink(Linking.createURL(`invite/${data.token}`));
    setCopied(false);
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    await Clipboard.setStringAsync(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUnlinkPartner = () => {
    Alert.alert("Desvincular pareja", "Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Desvincular",
        style: "destructive",
        onPress: async () => {
          if (!profile) return;
          await supabase
            .from("profiles")
            .update({ partner_id: null })
            .in("id", [profile.id, profile.partner_id!]);
          fetchProfile();
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background px-6 pt-6">
      <View className="items-center mb-8">
        {profile?.avatar_url ? (
          <Image
            source={{ uri: profile.avatar_url }}
            className="w-20 h-20 rounded-full mb-3"
          />
        ) : (
          <View className="w-20 h-20 rounded-full bg-surface items-center justify-center mb-3">
            <MaterialIcons name="person" size={40} color="#6b7280" />
          </View>
        )}
        <Text className="text-white text-xl font-bold">{profile?.name}</Text>
      </View>

      <View className="bg-surface rounded-2xl p-4 mb-6">
        <Text className="text-gray-400 text-sm mb-3">Pareja</Text>
        {partnerProfile ? (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              {partnerProfile.avatar_url ? (
                <Image
                  source={{ uri: partnerProfile.avatar_url }}
                  className="w-10 h-10 rounded-full mr-3"
                />
              ) : (
                <View className="w-10 h-10 rounded-full bg-surface-light items-center justify-center mr-3">
                  <MaterialIcons name="person" size={20} color="#6b7280" />
                </View>
              )}
              <Text className="text-white font-semibold">
                {partnerProfile.name}
              </Text>
            </View>
            <TouchableOpacity onPress={handleUnlinkPartner}>
              <MaterialIcons name="link-off" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ) : inviteLink ? (
          <View>
            <Text className="text-gray-400 text-xs mb-2">
              Compartí este link con tu pareja:
            </Text>
            <View className="flex-row items-center bg-background rounded-xl px-3 py-3">
              <Text
                className="flex-1 text-white text-xs mr-2"
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {inviteLink}
              </Text>
              <TouchableOpacity
                onPress={handleCopyLink}
                className="bg-primary px-3 py-2 rounded-lg flex-row items-center"
              >
                <MaterialIcons
                  name={copied ? "check" : "content-copy"}
                  size={16}
                  color="#fff"
                />
                <Text className="text-white text-xs font-semibold ml-1">
                  {copied ? "Copiado" : "Copiar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleInvitePartner}
            disabled={inviting}
            className="bg-primary py-3 rounded-xl items-center"
          >
            {inviting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold">Invitar pareja</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        onPress={signOut}
        className="bg-surface py-4 rounded-2xl items-center"
      >
        <Text className="text-danger font-semibold">Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

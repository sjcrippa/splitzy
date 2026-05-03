import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useAuthStore } from "@/lib/store/auth-store";
import { useObligationStore } from "@/lib/store/obligation-store";

export default function AddPaymentScreen() {
  const { obligationId } = useLocalSearchParams<{ obligationId: string }>();
  const router = useRouter();
  const { profile, partnerProfile } = useAuthStore();
  const { addPayment } = useObligationStore();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paidByMe, setPaidByMe] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Ingresá un monto válido");
      return;
    }
    if (!profile || !obligationId) return;

    const paidBy = paidByMe
      ? profile.id
      : partnerProfile?.id ?? profile.id;

    setSaving(true);
    await addPayment({
      obligation_id: obligationId,
      paid_by: paidBy,
      amount: parseFloat(amount),
      description: description.trim() || null,
      date,
    });
    setSaving(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <Stack.Screen
        options={{
          title: "Agregar pago",
          headerStyle: { backgroundColor: "#121220" },
          headerTintColor: "#fff",
        }}
      />

      <ScrollView className="flex-1 px-6 pt-4" keyboardShouldPersistTaps="handled">
        {/* Amount */}
        <Text className="text-gray-400 text-sm mb-2">Monto</Text>
        <View className="flex-row items-center bg-surface rounded-2xl px-4 py-3 mb-6">
          <Text className="text-white text-2xl mr-2">$</Text>
          <TextInput
            className="flex-1 text-white text-3xl font-bold"
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#4b5563"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        {/* Description */}
        <Text className="text-gray-400 text-sm mb-2">Descripción (opcional)</Text>
        <TextInput
          className="bg-surface text-white text-base rounded-2xl px-4 py-4 mb-6"
          placeholder="Ej: Boleta marzo"
          placeholderTextColor="#4b5563"
          value={description}
          onChangeText={setDescription}
        />

        {/* Paid by */}
        {partnerProfile && (
          <>
            <Text className="text-gray-400 text-sm mb-2">Pagó</Text>
            <View className="flex-row mb-6 gap-3">
              <TouchableOpacity
                onPress={() => setPaidByMe(true)}
                className={`flex-1 py-3 rounded-2xl items-center ${
                  paidByMe ? "bg-primary" : "bg-surface"
                }`}
              >
                <Text
                  className={`font-semibold ${
                    paidByMe ? "text-white" : "text-gray-400"
                  }`}
                >
                  Yo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPaidByMe(false)}
                className={`flex-1 py-3 rounded-2xl items-center ${
                  !paidByMe ? "bg-primary" : "bg-surface"
                }`}
              >
                <Text
                  className={`font-semibold ${
                    !paidByMe ? "text-white" : "text-gray-400"
                  }`}
                >
                  {partnerProfile.name || "Pareja"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Date */}
        <Text className="text-gray-400 text-sm mb-2">Fecha</Text>
        <TextInput
          className="bg-surface text-white text-base rounded-2xl px-4 py-4 mb-6"
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#4b5563"
          value={date}
          onChangeText={setDate}
        />

        {/* Save */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className={`py-4 rounded-2xl items-center mt-4 mb-8 ${
            saving ? "bg-gray-600" : "bg-primary"
          }`}
        >
          <Text className="text-white text-lg font-bold">
            {saving ? "Guardando..." : "Guardar pago"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

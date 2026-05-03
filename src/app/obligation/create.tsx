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
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/store/auth-store";
import { useObligationStore } from "@/lib/store/obligation-store";
import IconPicker from "@/components/IconPicker";
import type { ObligationType, Recurrence, SplitMode } from "@/lib/types";

export default function CreateObligationScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { addObligation } = useObligationStore();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("receipt");
  const [obligationType, setObligationType] = useState<ObligationType>("fixed");
  const [fixedAmount, setFixedAmount] = useState("");
  const [recurrence, setRecurrence] = useState<Recurrence>("monthly");
  const [splitMode, setSplitMode] = useState<SplitMode>("50/50");
  const [splitPct, setSplitPct] = useState("50");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Ponele un nombre a la obligación");
      return;
    }
    if (obligationType === "fixed" && (!fixedAmount || parseFloat(fixedAmount) <= 0)) {
      Alert.alert("Error", "Ingresá el monto fijo");
      return;
    }
    if (!profile) return;

    setSaving(true);
    await addObligation({
      created_by: profile.id,
      name: name.trim(),
      icon,
      obligation_type: obligationType,
      fixed_amount:
        obligationType === "fixed" ? parseFloat(fixedAmount) : null,
      recurrence,
      split_mode: splitMode,
      split_pct: splitMode === "custom" ? parseFloat(splitPct) : null,
    });
    setSaving(false);
    router.back();
  };

  const RECURRENCES: { key: Recurrence; label: string }[] = [
    { key: "monthly", label: "Mensual" },
    { key: "weekly", label: "Semanal" },
    { key: "one_time", label: "Una vez" },
    { key: "none", label: "Ninguna" },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView className="flex-1 px-6 pt-4" keyboardShouldPersistTaps="handled">
        {/* Name */}
        <Text className="text-gray-400 text-sm mb-2">Nombre</Text>
        <TextInput
          className="bg-surface text-white text-base rounded-2xl px-4 py-4 mb-6"
          placeholder="Ej: Alquiler"
          placeholderTextColor="#4b5563"
          value={name}
          onChangeText={setName}
        />

        {/* Icon */}
        <Text className="text-gray-400 text-sm mb-2">Icono</Text>
        <TouchableOpacity
          onPress={() => setShowIconPicker(true)}
          className="bg-surface flex-row items-center rounded-2xl px-4 py-4 mb-6"
        >
          <MaterialIcons name={icon as any} size={24} color="#6366f1" />
          <Text className="text-white text-base ml-3">Cambiar icono</Text>
        </TouchableOpacity>

        {/* Type */}
        <Text className="text-gray-400 text-sm mb-2">Tipo</Text>
        <View className="flex-row mb-6 gap-3">
          <TouchableOpacity
            onPress={() => setObligationType("fixed")}
            className={`flex-1 py-3 rounded-2xl items-center ${
              obligationType === "fixed" ? "bg-primary" : "bg-surface"
            }`}
          >
            <Text
              className={`font-semibold ${
                obligationType === "fixed" ? "text-white" : "text-gray-400"
              }`}
            >
              Fija
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setObligationType("variable")}
            className={`flex-1 py-3 rounded-2xl items-center ${
              obligationType === "variable" ? "bg-primary" : "bg-surface"
            }`}
          >
            <Text
              className={`font-semibold ${
                obligationType === "variable" ? "text-white" : "text-gray-400"
              }`}
            >
              Variable
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fixed amount */}
        {obligationType === "fixed" && (
          <>
            <Text className="text-gray-400 text-sm mb-2">Monto fijo</Text>
            <View className="flex-row items-center bg-surface rounded-2xl px-4 py-3 mb-6">
              <Text className="text-white text-2xl mr-2">$</Text>
              <TextInput
                className="flex-1 text-white text-3xl font-bold"
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#4b5563"
                value={fixedAmount}
                onChangeText={setFixedAmount}
              />
            </View>
          </>
        )}

        {/* Recurrence */}
        <Text className="text-gray-400 text-sm mb-2">Recurrencia</Text>
        <View className="flex-row mb-6 gap-2 flex-wrap">
          {RECURRENCES.map((r) => (
            <TouchableOpacity
              key={r.key}
              onPress={() => setRecurrence(r.key)}
              className={`px-4 py-2 rounded-full ${
                recurrence === r.key ? "bg-primary" : "bg-surface"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  recurrence === r.key ? "text-white" : "text-gray-400"
                }`}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Split */}
        <Text className="text-gray-400 text-sm mb-2">División</Text>
        <View className="flex-row mb-4 gap-3">
          <TouchableOpacity
            onPress={() => setSplitMode("50/50")}
            className={`flex-1 py-3 rounded-2xl items-center ${
              splitMode === "50/50" ? "bg-primary" : "bg-surface"
            }`}
          >
            <Text
              className={`font-semibold ${
                splitMode === "50/50" ? "text-white" : "text-gray-400"
              }`}
            >
              50/50
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSplitMode("custom")}
            className={`flex-1 py-3 rounded-2xl items-center ${
              splitMode === "custom" ? "bg-primary" : "bg-surface"
            }`}
          >
            <Text
              className={`font-semibold ${
                splitMode === "custom" ? "text-white" : "text-gray-400"
              }`}
            >
              Personalizado
            </Text>
          </TouchableOpacity>
        </View>

        {splitMode === "custom" && (
          <View className="bg-surface rounded-2xl px-4 py-4 mb-6">
            <Text className="text-gray-400 text-sm mb-2">
              Tu porcentaje: {splitPct}%
            </Text>
            <TextInput
              className="bg-surface-light text-white text-lg rounded-xl px-4 py-3"
              keyboardType="numeric"
              value={splitPct}
              onChangeText={(v) => {
                const n = parseInt(v) || 0;
                setSplitPct(String(Math.min(100, Math.max(0, n))));
              }}
            />
            <Text className="text-gray-500 text-xs mt-2">
              Tu pareja: {100 - (parseInt(splitPct) || 0)}%
            </Text>
          </View>
        )}

        {/* Save */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className={`py-4 rounded-2xl items-center mt-4 mb-8 ${
            saving ? "bg-gray-600" : "bg-primary"
          }`}
        >
          <Text className="text-white text-lg font-bold">
            {saving ? "Guardando..." : "Crear obligación"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <IconPicker
        selected={icon}
        onSelect={setIcon}
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
      />
    </KeyboardAvoidingView>
  );
}

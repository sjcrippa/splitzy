import { useState, useEffect } from "react";
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
import { useExpenseStore } from "@/lib/store/expense-store";
import CategoryPicker from "@/components/CategoryPicker";

export default function AddExpenseScreen() {
  const router = useRouter();
  const { profile, partnerProfile } = useAuthStore();
  const { categories, fetchCategories, addExpense } = useExpenseStore();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [type, setType] = useState<"personal" | "shared">("personal");
  const [paidByMe, setPaidByMe] = useState(true);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleSave = async () => {
    if (!amount || !categoryId || !description.trim()) {
      Alert.alert("Error", "Completá todos los campos");
      return;
    }
    if (!profile) return;

    setSaving(true);
    await addExpense({
      user_id: profile.id,
      paid_by: paidByMe ? profile.id : partnerProfile?.id ?? profile.id,
      category_id: categoryId,
      amount: parseFloat(amount),
      description: description.trim(),
      type,
      split_mode: "50/50",
      split_pct: null,
      date: new Date().toISOString().split("T")[0],
    });
    setSaving(false);

    setAmount("");
    setDescription("");
    setCategoryId(null);
    setType("personal");
    setPaidByMe(true);

    router.navigate("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView className="flex-1 px-6 pt-4" keyboardShouldPersistTaps="handled">
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

        <Text className="text-gray-400 text-sm mb-2">Descripción</Text>
        <TextInput
          className="bg-surface text-white text-base rounded-2xl px-4 py-4 mb-6"
          placeholder="Ej: Super del lunes"
          placeholderTextColor="#4b5563"
          value={description}
          onChangeText={setDescription}
        />

        <Text className="text-gray-400 text-sm mb-2">Categoría</Text>
        <TouchableOpacity
          onPress={() => setShowCategoryPicker(true)}
          className="bg-surface flex-row items-center rounded-2xl px-4 py-4 mb-6"
        >
          {selectedCategory ? (
            <>
              <MaterialIcons
                name={selectedCategory.icon as any}
                size={24}
                color="#6366f1"
              />
              <Text className="text-white text-base ml-3">
                {selectedCategory.name}
              </Text>
            </>
          ) : (
            <Text className="text-gray-500 text-base">Elegir categoría</Text>
          )}
        </TouchableOpacity>

        <Text className="text-gray-400 text-sm mb-2">Tipo</Text>
        <View className="flex-row mb-6 gap-3">
          <TouchableOpacity
            onPress={() => setType("personal")}
            className={`flex-1 py-3 rounded-2xl items-center ${
              type === "personal" ? "bg-primary" : "bg-surface"
            }`}
          >
            <Text
              className={`font-semibold ${
                type === "personal" ? "text-white" : "text-gray-400"
              }`}
            >
              Personal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setType("shared")}
            className={`flex-1 py-3 rounded-2xl items-center ${
              type === "shared" ? "bg-primary" : "bg-surface"
            }`}
          >
            <Text
              className={`font-semibold ${
                type === "shared" ? "text-white" : "text-gray-400"
              }`}
            >
              Compartido
            </Text>
          </TouchableOpacity>
        </View>

        {type === "shared" && partnerProfile && (
          <>
            <Text className="text-gray-400 text-sm mb-2">Pagó</Text>
            <View className="flex-row mb-6 gap-3">
              <TouchableOpacity
                onPress={() => setPaidByMe(true)}
                className={`flex-1 py-3 rounded-2xl items-center ${
                  paidByMe ? "bg-secondary" : "bg-surface"
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
                  !paidByMe ? "bg-secondary" : "bg-surface"
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

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          className={`py-4 rounded-2xl items-center mt-4 mb-8 ${
            saving ? "bg-gray-600" : "bg-primary"
          }`}
        >
          <Text className="text-white text-lg font-bold">
            {saving ? "Guardando..." : "Guardar gasto"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <CategoryPicker
        categories={categories}
        selected={categoryId}
        onSelect={setCategoryId}
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
      />
    </KeyboardAvoidingView>
  );
}

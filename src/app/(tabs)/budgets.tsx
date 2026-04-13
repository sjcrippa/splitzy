import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useBudgetStore } from "@/lib/store/budget-store";
import { useExpenseStore } from "@/lib/store/expense-store";
import BudgetBar from "@/components/BudgetBar";
import CategoryPicker from "@/components/CategoryPicker";
import EmptyState from "@/components/EmptyState";
import { getCurrentMonth } from "@/lib/utils";

export default function BudgetsScreen() {
  const { budgets, fetchBudgets, upsertBudget, deleteBudget } =
    useBudgetStore();
  const { expenses, categories, fetchCategories, fetchExpenses } =
    useExpenseStore();

  const [showAdd, setShowAdd] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newCategoryId, setNewCategoryId] = useState<string | null>(null);
  const [newType, setNewType] = useState<"personal" | "shared">("personal");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
    fetchExpenses();
  }, []);

  const currentMonth = getCurrentMonth();

  const getSpent = (
    categoryId: string,
    type: "personal" | "shared"
  ): number => {
    return expenses
      .filter(
        (e) =>
          e.category_id === categoryId &&
          e.type === type &&
          e.date.startsWith(currentMonth.slice(0, 7))
      )
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const handleAddBudget = async () => {
    if (!newCategoryId || !newAmount) {
      Alert.alert("Error", "Completá todos los campos");
      return;
    }
    await upsertBudget({
      category_id: newCategoryId,
      amount: parseFloat(newAmount),
      type: newType,
    });
    setShowAdd(false);
    setNewAmount("");
    setNewCategoryId(null);
  };

  const selectedCategory = categories.find((c) => c.id === newCategoryId);

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        renderItem={({ item }) => (
          <BudgetBar
            budget={item}
            spent={getSpent(item.category_id, item.type)}
            onDelete={deleteBudget}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="pie-chart"
            title="Sin presupuestos"
            subtitle="Creá un presupuesto mensual para controlar tus gastos"
          />
        }
        ListFooterComponent={
          <TouchableOpacity
            onPress={() => setShowAdd(true)}
            className="bg-primary/10 border border-primary/30 py-4 rounded-2xl items-center mt-2"
          >
            <Text className="text-primary font-semibold">
              + Agregar presupuesto
            </Text>
          </TouchableOpacity>
        }
      />

      <Modal visible={showAdd} transparent animationType="slide">
        <View className="flex-1 justify-end">
          <View className="bg-surface rounded-t-3xl p-6">
            <Text className="text-white text-lg font-bold mb-4">
              Nuevo presupuesto
            </Text>

            <Text className="text-gray-400 text-sm mb-2">Categoría</Text>
            <TouchableOpacity
              onPress={() => setShowCategoryPicker(true)}
              className="bg-surface-light rounded-xl px-4 py-3 mb-4"
            >
              <Text className="text-white">
                {selectedCategory?.name ?? "Elegir categoría"}
              </Text>
            </TouchableOpacity>

            <Text className="text-gray-400 text-sm mb-2">Monto límite</Text>
            <TextInput
              className="bg-surface-light text-white rounded-xl px-4 py-3 mb-4 text-lg"
              keyboardType="numeric"
              placeholder="$0"
              placeholderTextColor="#4b5563"
              value={newAmount}
              onChangeText={setNewAmount}
            />

            <Text className="text-gray-400 text-sm mb-2">Tipo</Text>
            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity
                onPress={() => setNewType("personal")}
                className={`flex-1 py-3 rounded-xl items-center ${
                  newType === "personal" ? "bg-primary" : "bg-surface-light"
                }`}
              >
                <Text
                  className={
                    newType === "personal"
                      ? "text-white font-semibold"
                      : "text-gray-400"
                  }
                >
                  Personal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setNewType("shared")}
                className={`flex-1 py-3 rounded-xl items-center ${
                  newType === "shared" ? "bg-primary" : "bg-surface-light"
                }`}
              >
                <Text
                  className={
                    newType === "shared"
                      ? "text-white font-semibold"
                      : "text-gray-400"
                  }
                >
                  Compartido
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleAddBudget}
              className="bg-primary py-4 rounded-2xl items-center"
            >
              <Text className="text-white font-bold text-base">Guardar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowAdd(false)}
              className="items-center py-3 mt-2"
            >
              <Text className="text-gray-400">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CategoryPicker
        categories={categories}
        selected={newCategoryId}
        onSelect={setNewCategoryId}
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
      />
    </View>
  );
}

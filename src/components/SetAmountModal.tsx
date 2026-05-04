import { useState, useEffect } from "react";
import { View, Text, Modal, TextInput, TouchableOpacity } from "react-native";
import { getDaysInMonth, getCurrentMonth } from "@/lib/utils";

interface SetAmountModalProps {
  visible: boolean;
  currentAmount?: number;
  onSave: (amount: number) => void;
  onClose: () => void;
}

export default function SetAmountModal({
  visible,
  currentAmount,
  onSave,
  onClose,
}: SetAmountModalProps) {
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (visible && currentAmount) {
      setAmount(String(currentAmount));
    } else if (visible) {
      setAmount("");
    }
  }, [visible, currentAmount]);

  const numericAmount = parseFloat(amount) || 0;
  const daysInMonth = getDaysInMonth(getCurrentMonth().slice(0, 7));
  const dailyRate = numericAmount > 0 ? Math.round(numericAmount / daysInMonth) : 0;

  const handleSave = () => {
    if (numericAmount <= 0) return;
    onSave(numericAmount);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end">
        <View className="bg-surface rounded-t-3xl p-6">
          <Text className="text-white text-lg font-bold mb-4">
            {currentAmount ? "Editar monto mensual" : "Configurar plan de gasto"}
          </Text>

          <Text className="text-gray-400 text-sm mb-2">
            Monto disponible este mes
          </Text>
          <TextInput
            className="bg-surface-light text-white rounded-xl px-4 py-3 mb-2 text-lg"
            keyboardType="numeric"
            placeholder="$0"
            placeholderTextColor="#4b5563"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />

          {numericAmount > 0 && (
            <Text className="text-gray-500 text-sm mb-4">
              ~${dailyRate} por dia aprox
            </Text>
          )}

          <TouchableOpacity
            onPress={handleSave}
            className="bg-primary py-4 rounded-2xl items-center mt-2"
          >
            <Text className="text-white font-bold text-base">Guardar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            className="items-center py-3 mt-2"
          >
            <Text className="text-gray-400">Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

import { View, Text, TouchableOpacity, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ObligationPayment } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/auth-store";

interface PaymentCardProps {
  payment: ObligationPayment;
  onDelete?: (id: string) => void;
}

export default function PaymentCard({ payment, onDelete }: PaymentCardProps) {
  const { profile, partnerProfile } = useAuthStore();
  const paidByMe = payment.paid_by === profile?.id;
  const payerName = paidByMe ? "Vos" : partnerProfile?.name ?? "Pareja";

  const handleDelete = () => {
    if (!paidByMe || !onDelete) return;
    Alert.alert("Eliminar pago", "Seguro querés eliminar este pago?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => onDelete(payment.id),
      },
    ]);
  };

  return (
    <TouchableOpacity
      onLongPress={handleDelete}
      disabled={!paidByMe || !onDelete}
      className="bg-surface rounded-2xl p-4 mb-2 flex-row items-center"
    >
      <View
        className={`w-10 h-10 rounded-xl items-center justify-center ${
          paidByMe ? "bg-primary/20" : "bg-secondary/20"
        }`}
      >
        <MaterialIcons
          name="payment"
          size={20}
          color={paidByMe ? "#6366f1" : "#f59e0b"}
        />
      </View>

      <View className="flex-1 ml-3">
        <Text className="text-white text-sm font-medium">
          {payment.description || "Pago"}
        </Text>
        <Text className="text-gray-500 text-xs mt-0.5">
          {payerName} {"\u00B7"} {formatDate(payment.date)}
        </Text>
      </View>

      <Text className="text-white font-bold text-base">
        {formatCurrency(payment.amount)}
      </Text>
    </TouchableOpacity>
  );
}

import { View, Text } from "react-native";
import { useAuthStore } from "@/lib/store/auth-store";
import { useExpenseStore } from "@/lib/store/expense-store";
import { formatCurrency } from "@/lib/utils";

export default function BalanceSummary() {
  const { profile, partnerProfile } = useAuthStore();
  const { expenses } = useExpenseStore();

  if (!profile || !partnerProfile) {
    return (
      <View className="bg-surface rounded-2xl p-6 mx-4 mt-4">
        <Text className="text-gray-400 text-center">
          Vinculá tu pareja desde el perfil para ver el balance
        </Text>
      </View>
    );
  }

  const sharedExpenses = expenses.filter((e) => e.type === "shared");
  const myPaid = sharedExpenses
    .filter((e) => e.paid_by === profile.id)
    .reduce((sum, e) => sum + e.amount, 0);
  const partnerPaid = sharedExpenses
    .filter((e) => e.paid_by === partnerProfile.id)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalShared = myPaid + partnerPaid;
  const fairShare = totalShared / 2;
  const balance = myPaid - fairShare;

  return (
    <View className="bg-surface rounded-2xl p-6 mx-4 mt-4">
      <Text className="text-gray-400 text-sm mb-1">
        Balance con {partnerProfile.name}
      </Text>
      {balance === 0 ? (
        <Text className="text-white text-2xl font-bold">Están a mano</Text>
      ) : balance > 0 ? (
        <>
          <Text className="text-success text-2xl font-bold">
            {partnerProfile.name} te debe
          </Text>
          <Text className="text-success text-3xl font-bold mt-1">
            {formatCurrency(balance)}
          </Text>
        </>
      ) : (
        <>
          <Text className="text-secondary text-2xl font-bold">
            Le debés a {partnerProfile.name}
          </Text>
          <Text className="text-secondary text-3xl font-bold mt-1">
            {formatCurrency(Math.abs(balance))}
          </Text>
        </>
      )}

      <View className="flex-row mt-4 gap-4">
        <View className="flex-1 bg-surface-light rounded-xl p-3">
          <Text className="text-gray-500 text-xs">Vos pagaste</Text>
          <Text className="text-white font-bold text-base">
            {formatCurrency(myPaid)}
          </Text>
        </View>
        <View className="flex-1 bg-surface-light rounded-xl p-3">
          <Text className="text-gray-500 text-xs">
            {partnerProfile.name} pagó
          </Text>
          <Text className="text-white font-bold text-base">
            {formatCurrency(partnerPaid)}
          </Text>
        </View>
      </View>
    </View>
  );
}

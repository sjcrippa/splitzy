import { useEffect } from "react";
import { View, Text } from "react-native";
import { useAuthStore } from "@/lib/store/auth-store";
import { useObligationStore } from "@/lib/store/obligation-store";
import { formatCurrency } from "@/lib/utils";

export default function BalanceSummary() {
  const { profile, partnerProfile } = useAuthStore();
  const { obligations, fetchObligations, getSummary } = useObligationStore();

  useEffect(() => {
    fetchObligations();
  }, []);

  if (!profile || !partnerProfile) {
    return (
      <View className="bg-surface rounded-2xl p-6 mx-4 mt-4">
        <Text className="text-gray-400 text-center">
          Vinculá tu pareja desde el perfil para ver el balance
        </Text>
      </View>
    );
  }

  const summaries = obligations.map((o) =>
    getSummary(o, profile.id, partnerProfile.id)
  );

  const totalBalance = summaries.reduce((sum, s) => sum + s.balance, 0);
  const totalMyPaid = summaries.reduce((sum, s) => sum + s.myPaid, 0);
  const totalPartnerPaid = summaries.reduce((sum, s) => sum + s.partnerPaid, 0);

  return (
    <View className="bg-surface rounded-2xl p-6 mx-4 mt-4">
      <Text className="text-gray-400 text-sm mb-1">
        Balance con {partnerProfile.name}
      </Text>
      {totalBalance === 0 ? (
        <Text className="text-white text-2xl font-bold">Están a mano</Text>
      ) : totalBalance > 0 ? (
        <>
          <Text className="text-success text-2xl font-bold">
            {partnerProfile.name} te debe
          </Text>
          <Text className="text-success text-3xl font-bold mt-1">
            {formatCurrency(totalBalance)}
          </Text>
        </>
      ) : (
        <>
          <Text className="text-secondary text-2xl font-bold">
            Le debés a {partnerProfile.name}
          </Text>
          <Text className="text-secondary text-3xl font-bold mt-1">
            {formatCurrency(Math.abs(totalBalance))}
          </Text>
        </>
      )}

      <View className="flex-row mt-4 gap-4">
        <View className="flex-1 bg-surface-light rounded-xl p-3">
          <Text className="text-gray-500 text-xs">Vos pagaste</Text>
          <Text className="text-white font-bold text-base">
            {formatCurrency(totalMyPaid)}
          </Text>
        </View>
        <View className="flex-1 bg-surface-light rounded-xl p-3">
          <Text className="text-gray-500 text-xs">
            {partnerProfile.name} pagó
          </Text>
          <Text className="text-white font-bold text-base">
            {formatCurrency(totalPartnerPaid)}
          </Text>
        </View>
      </View>
    </View>
  );
}

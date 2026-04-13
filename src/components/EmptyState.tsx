import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
}

export default function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <MaterialIcons name={icon} size={64} color="#4b5563" />
      <Text className="text-gray-400 text-lg font-semibold mt-4">{title}</Text>
      <Text className="text-gray-500 text-sm text-center mt-2">{subtitle}</Text>
    </View>
  );
}

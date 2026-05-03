import { View, Text, TouchableOpacity, Modal, FlatList } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const ICONS: (keyof typeof MaterialIcons.glyphMap)[] = [
  "home",
  "shopping-cart",
  "restaurant",
  "receipt",
  "local-hospital",
  "directions-car",
  "electric-bolt",
  "water-drop",
  "wifi",
  "phone",
  "pets",
  "fitness-center",
  "school",
  "child-care",
  "local-laundry-service",
  "cleaning-services",
  "build",
  "movie",
  "flight",
  "local-gas-station",
  "local-pharmacy",
  "checkroom",
  "savings",
  "credit-card",
  "account-balance",
  "more-horiz",
];

interface IconPickerProps {
  selected: string;
  onSelect: (icon: string) => void;
  visible: boolean;
  onClose: () => void;
}

export default function IconPicker({
  selected,
  onSelect,
  visible,
  onClose,
}: IconPickerProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end">
        <View className="bg-surface rounded-t-3xl p-6 max-h-[60%]">
          <Text className="text-white text-lg font-bold mb-4">Elegir icono</Text>
          <FlatList
            data={ICONS}
            numColumns={5}
            keyExtractor={(item) => item}
            columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 12 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                className={`w-14 h-14 rounded-xl items-center justify-center ${
                  selected === item ? "bg-primary/30" : "bg-surface-light"
                }`}
              >
                <MaterialIcons
                  name={item}
                  size={28}
                  color={selected === item ? "#6366f1" : "#9ca3af"}
                />
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity onPress={onClose} className="mt-4 items-center py-3">
            <Text className="text-gray-400 text-base">Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

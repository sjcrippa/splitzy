import { View, Text, TouchableOpacity, Modal, FlatList } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Category } from "@/lib/types";

interface CategoryPickerProps {
  categories: Category[];
  selected: string | null;
  onSelect: (id: string) => void;
  visible: boolean;
  onClose: () => void;
}

export default function CategoryPicker({
  categories,
  selected,
  onSelect,
  visible,
  onClose,
}: CategoryPickerProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end">
        <View className="bg-surface rounded-t-3xl p-6 max-h-[60%]">
          <Text className="text-white text-lg font-bold mb-4">Categoría</Text>
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item.id);
                  onClose();
                }}
                className={`flex-row items-center p-4 rounded-xl mb-2 ${
                  selected === item.id ? "bg-primary/20" : "bg-surface-light"
                }`}
              >
                <MaterialIcons
                  name={item.icon as any}
                  size={24}
                  color={selected === item.id ? "#6366f1" : "#9ca3af"}
                />
                <Text
                  className={`ml-3 text-base ${
                    selected === item.id
                      ? "text-primary font-semibold"
                      : "text-gray-300"
                  }`}
                >
                  {item.name}
                </Text>
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

import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "../../../shared/ui/native";

import type { DashboardAction, DashboardRoute } from "../data/dashboardActions";

type DashboardActionGridProps = {
  actions: readonly DashboardAction[];
  onActionPress: (href: DashboardRoute) => void;
};

export default function DashboardActionGrid({ actions, onActionPress }: DashboardActionGridProps) {
  return (
    <View style={styles.gridContainer}>
      {actions.map((action) => (
        <Pressable
          key={action.id}
          accessibilityRole="button"
          accessibilityLabel={action.title}
          accessibilityHint={`Opens ${action.destinationLabel}`}
          onPress={() => onActionPress(action.href)}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          <Ionicons name={action.icon} size={26} color="#174EA6" />
          <Text style={styles.actionButtonText}>{action.title}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  actionButton: {
    width: "48%",
    minHeight: 64,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
  },
  actionButtonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#172B4D",
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
    backgroundColor: "#F1F5F9",
  },
});

import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
          <Ionicons name={action.icon} size={24} color="#333" />
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
    justifyContent: "space-between",
  },
  actionButton: {
    width: "22%",
    aspectRatio: 1,
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#FFF",
  },
  actionButtonText: {
    fontSize: 10,
    color: "#333",
    marginTop: 4,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});

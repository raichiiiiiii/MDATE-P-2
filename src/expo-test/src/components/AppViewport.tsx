import type { ReactNode } from "react";
import {
  Platform,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";

type AppViewportProps = {
  children: ReactNode;
  maxWidth?: number;
  backgroundColor?: string;
  style?: ViewStyle;
};

export default function AppViewport({
  children,
  maxWidth = 430,
  backgroundColor = "#F8FAFC",
  style,
}: AppViewportProps) {
  return (
    <View style={[styles.root, { backgroundColor }]}>
      <View
        style={[
          styles.viewport,
          {
            maxWidth: Platform.OS === "web" ? maxWidth : undefined,
            backgroundColor,
          },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#E2E8F0",
  },
  viewport: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    overflow: "hidden",
  },
});


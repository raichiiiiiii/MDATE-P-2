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
  maxHeight?: number;
  backgroundColor?: string;
  style?: ViewStyle;
};

export default function AppViewport({
  children,
  maxWidth = 412,
  maxHeight = 892,
  backgroundColor = "#F8FAFC",
  style,
}: AppViewportProps) {
  const desktopFrameStyle: ViewStyle | undefined = Platform.OS === "web"
    ? {
        maxWidth,
        maxHeight,
        aspectRatio: 9 / 19.5,
        flexShrink: 1,
      }
    : undefined;

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.viewport,
          desktopFrameStyle,
          { backgroundColor },
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
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
  },
  viewport: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    overflow: "hidden",
  },
});

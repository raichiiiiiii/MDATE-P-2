import type { ReactNode } from "react";
import {
  Platform,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { colors, layout } from "../shared/theme/tokens";

type AppViewportProps = {
  children: ReactNode;
  maxWidth?: number;
  backgroundColor?: string;
  style?: ViewStyle;
};

// React Native Web accepts CSS viewport units at runtime, but its shared
// ViewStyle type does not consistently expose every CSS unit across versions.
const dynamicViewportStyle = Platform.OS === "web"
  ? ({ height: "100dvh", minHeight: "100dvh", boxSizing: "border-box" } as unknown as ViewStyle)
  : undefined;

export default function AppViewport({
  children,
  maxWidth = layout.patientViewportMaxWidth,
  backgroundColor = colors.page,
  style,
}: AppViewportProps) {
  const desktopFrameStyle: ViewStyle | undefined = Platform.OS === "web"
    ? ({
        width: "100%",
        maxWidth,
        flex: 1,
        flexShrink: 0,
        boxSizing: "border-box",
      } as unknown as ViewStyle)
    : undefined;

  return (
    <View style={[styles.root, dynamicViewportStyle, { backgroundColor }]}>
      <View
        style={[
          styles.viewport,
          dynamicViewportStyle,
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
    justifyContent: "flex-start",
    backgroundColor: colors.page,
  },
  viewport: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    overflow: "hidden",
    backgroundColor: colors.page,
  },
});

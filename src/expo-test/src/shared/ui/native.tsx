import React, { forwardRef } from "react";
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from "react-native";

// Re-export the rest of React Native unchanged. Text and TextInput below are
// intentionally overridden so the existing screens share the app typography.
export * from "react-native";

const POPPINS_BY_WEIGHT: Readonly<Record<string, string>> = {
  "100": "Poppins_100Thin",
  "200": "Poppins_200ExtraLight",
  "300": "Poppins_300Light",
  "400": "Poppins_400Regular",
  "500": "Poppins_500Medium",
  "600": "Poppins_600SemiBold",
  "700": "Poppins_700Bold",
  "800": "Poppins_800ExtraBold",
  "900": "Poppins_900Black",
};

function withPoppins(style: StyleProp<TextStyle>): StyleProp<TextStyle> {
  const flattened = StyleSheet.flatten(style);

  // Keep deliberate font overrides (for example, the dashboard monospace
  // placeholder) instead of replacing them with Poppins.
  if (typeof flattened?.fontFamily === "string" && flattened.fontFamily.length > 0) {
    return style;
  }

  const requestedWeight = String(flattened?.fontWeight ?? "400");
  const normalizedWeight =
    requestedWeight === "bold"
      ? "700"
      : requestedWeight === "normal"
        ? "400"
        : requestedWeight;

  const fontFamily = POPPINS_BY_WEIGHT[normalizedWeight] ?? "Poppins_400Regular";

  // Each Google Fonts export is a distinct font face, so use the matching
  // face and neutralize synthetic bolding from the original fontWeight.
  return [style, { fontFamily, fontWeight: "normal" }];
}

export const Text = forwardRef<React.ElementRef<typeof NativeText>, TextProps>(
  function PoppinsText({ style, ...props }, ref) {
    return <NativeText ref={ref} {...props} style={withPoppins(style)} />;
  },
);

Text.displayName = "Text";

export const TextInput = forwardRef<
  React.ElementRef<typeof NativeTextInput>,
  TextInputProps
>(function PoppinsTextInput({ style, ...props }, ref) {
  return <NativeTextInput ref={ref} {...props} style={withPoppins(style)} />;
});

TextInput.displayName = "TextInput";

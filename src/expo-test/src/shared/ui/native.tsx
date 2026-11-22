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
import { usePatientPreferences } from "../theme/PatientPreferencesContext";

// Re-export the rest of React Native unchanged. Text and TextInput below are
// intentionally overridden so screens share Poppins and account accessibility
// preferences whenever they import from this module.
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

function isWhite(color: unknown): boolean {
  if (typeof color !== "string") return false;
  const normalized = color.trim().toLowerCase();
  return normalized === "white" || normalized === "#fff" || normalized === "#ffffff" ||
    normalized === "rgb(255, 255, 255)" || normalized === "rgba(255, 255, 255, 1)";
}

function accessibleTextStyle(
  style: StyleProp<TextStyle>,
  textSize: "small" | "medium" | "large",
  highContrast: boolean,
): StyleProp<TextStyle> {
  const flattened = StyleSheet.flatten(style);
  const requestedWeight = String(flattened?.fontWeight ?? "400");
  const normalizedWeight = requestedWeight === "bold"
    ? "700"
    : requestedWeight === "normal" ? "400" : requestedWeight;
  const hasExplicitFontFamily = typeof flattened?.fontFamily === "string" && flattened.fontFamily.length > 0;
  const fontFamily = hasExplicitFontFamily
    ? flattened.fontFamily
    : POPPINS_BY_WEIGHT[normalizedWeight] ?? POPPINS_BY_WEIGHT["400"];

  const scale = textSize === "large" ? 1.2 : textSize === "small" ? 0.9 : 1;
  const requestedSize = typeof flattened?.fontSize === "number" ? flattened.fontSize : 16;
  // The design specification sets 16px as the minimum text floor at every setting.
  const fontSize = Math.max(16, Math.round(requestedSize * scale));
  const requestedLineHeight = typeof flattened?.lineHeight === "number"
    ? flattened.lineHeight * scale
    : fontSize * 1.4;
  const lineHeight = Math.max(Math.round(fontSize * 1.3), Math.round(requestedLineHeight));

  return [style, {
    fontFamily,
    ...(hasExplicitFontFamily ? {} : { fontWeight: "normal" as const }),
    fontSize,
    lineHeight,
    ...(highContrast && !isWhite(flattened?.color) ? { color: "#000000" } : {}),
  }];
}

export const Text = forwardRef<React.ElementRef<typeof NativeText>, TextProps>(
  function PatientText({ style, ...props }, ref) {
    const preferences = usePatientPreferences();
    return (
      <NativeText
        ref={ref}
        {...props}
        style={accessibleTextStyle(style, preferences.accessibility.textSize, preferences.accessibility.contrast === "high")}
      />
    );
  },
);

Text.displayName = "Text";

export const TextInput = forwardRef<
  React.ElementRef<typeof NativeTextInput>,
  TextInputProps
>(function PatientTextInput({ style, placeholderTextColor, ...props }, ref) {
  const preferences = usePatientPreferences();
  const highContrast = preferences.accessibility.contrast === "high";
  return (
    <NativeTextInput
      ref={ref}
      {...props}
      placeholderTextColor={highContrast && !isWhite(placeholderTextColor) ? "#262626" : placeholderTextColor}
      style={accessibleTextStyle(style, preferences.accessibility.textSize, highContrast)}
    />
  );
});

TextInput.displayName = "TextInput";

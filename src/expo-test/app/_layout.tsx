import { Stack } from "expo-router";
import { useFonts } from "expo-font";

import { Poppins_100Thin } from "@expo-google-fonts/poppins/100Thin";
import { Poppins_200ExtraLight } from "@expo-google-fonts/poppins/200ExtraLight";
import { Poppins_300Light } from "@expo-google-fonts/poppins/300Light";
import { Poppins_400Regular } from "@expo-google-fonts/poppins/400Regular";
import { Poppins_500Medium } from "@expo-google-fonts/poppins/500Medium";
import { Poppins_600SemiBold } from "@expo-google-fonts/poppins/600SemiBold";
import { Poppins_700Bold } from "@expo-google-fonts/poppins/700Bold";
import { Poppins_800ExtraBold } from "@expo-google-fonts/poppins/800ExtraBold";
import { Poppins_900Black } from "@expo-google-fonts/poppins/900Black";

import AppViewport from "../src/components/AppViewport";
import { AuthProvider, useAuth } from "../src/features/auth/AuthProvider";

function RootNavigator() {
  const { phase, user } = useAuth();
  const isTherapist = user?.roles.some((role) => role.toLowerCase() === "therapist") ?? false;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F8FAFC" } }}>
      <Stack.Protected guard={phase === "loading" || phase === "error"}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={phase === "signed-out"}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="reset-password" />
      </Stack.Protected>
      <Stack.Protected guard={phase === "setup-required"}>
        <Stack.Screen name="(account-setup)" />
      </Stack.Protected>
      <Stack.Protected guard={phase === "ready"}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={phase === "ready" && isTherapist}>
        <Stack.Screen name="(therapist-portal)" />
      </Stack.Protected>
      {/* Verification links must remain reachable while signed in or signed out. */}
      <Stack.Screen name="confirm-email-change" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_100Thin,
    Poppins_200ExtraLight,
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });

  // Do not render screens until their font faces are ready. If loading fails,
  // allow the app to render with the platform's fallback font instead.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <AppViewport>
        <RootNavigator />
      </AppViewport>
    </AuthProvider>
  );
}

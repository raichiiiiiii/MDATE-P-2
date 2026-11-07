import { Stack } from "expo-router";
import AppViewport from "../src/components/AppViewport";
import { AuthProvider, useAuth } from "../src/features/auth/AuthProvider";

function RootNavigator() {
  const { phase, user } = useAuth();
  const isTherapist = user?.roles.some((role) => role.toLowerCase() === "therapist") ?? false;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F8FAFC" } }}>
      {/* Keep the splash route mounted for a ready account until its animated
          progress reaches 100%; SplashScreen then replaces it with dashboard. */}
      <Stack.Protected guard={phase === "loading" || phase === "error" || phase === "ready"}>
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
    </Stack>
  );
}

export default function RootLayout() {
  return <AuthProvider><AppViewport><RootNavigator /></AppViewport></AuthProvider>;
}

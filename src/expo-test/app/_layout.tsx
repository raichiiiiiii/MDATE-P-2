import { Stack } from "expo-router";
import { Auth0Provider } from "react-native-auth0";

import AppViewport from "../src/components/AppViewport";
import { AuthFlowProvider, useAuthFlow } from "../src/features/auth/AuthFlowProvider";
import { AUTH0_CLIENT_ID, AUTH0_DOMAIN } from "../src/features/auth/auth0Config";

function RootNavigator() {
  const { phase, account } = useAuthFlow();

  console.log("[MDATE routing]", {
    phase,
    roles: account?.roles,
  }); 

  const isTherapist =
    account?.roles.some((role) => role.toLowerCase() === "therapist") ?? false;

  return (
    <Stack
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: "#F8FAFC" },
    }}
    >
    <Stack.Protected guard={phase === "loading" || phase === "error"}>
    <Stack.Screen name="index" />
    </Stack.Protected>

    <Stack.Protected guard={phase === "signed-out"}>
    <Stack.Screen name="(auth)" />
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
  if (!AUTH0_CLIENT_ID) {
    throw new Error(
      "Missing Auth0 client ID. Set EXPO_PUBLIC_AUTH0_NATIVE_CLIENT_ID in your .env file."
    );
  }

  return (
    <Auth0Provider domain={AUTH0_DOMAIN} clientId={AUTH0_CLIENT_ID}>
    <AuthFlowProvider>
    <AppViewport>
    <RootNavigator />
    </AppViewport>
    </AuthFlowProvider>
    </Auth0Provider>
  );
}

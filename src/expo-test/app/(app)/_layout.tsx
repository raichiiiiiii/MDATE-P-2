import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      initialRouteName="(tabs)"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F8FAFC" } }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modules/[moduleId]" />
      <Stack.Screen name="submodules/[submoduleId]" />
      <Stack.Screen name="q-sets/[qSetId]" />
    </Stack>
  );
}

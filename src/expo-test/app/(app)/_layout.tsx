import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      initialRouteName="(main)"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F8FAFC" } }}
    >
      <Stack.Screen name="(main)" />
      <Stack.Screen name="modules/[moduleId]" />
      <Stack.Screen name="submodules/[submoduleId]" />
      <Stack.Screen name="q-sets/[qSetId]" />
    </Stack>
  );
}

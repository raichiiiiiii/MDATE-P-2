import { Tabs } from "expo-router";

export default function AppTabsLayout() {
  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1D4ED8",
        tabBarInactiveTintColor: "#475569",
        tabBarStyle: {
          minHeight: 64,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: "#FFFFFF",
          borderTopColor: "#CBD5E1",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: "Home", tabBarLabel: "Home", tabBarAccessibilityLabel: "Home dashboard" }}
      />
      <Tabs.Screen
        name="modules"
        options={{ title: "Training", tabBarLabel: "Training", tabBarAccessibilityLabel: "Training modules" }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: "Progress", tabBarLabel: "Progress", tabBarAccessibilityLabel: "Your progress" }}
      />
      <Tabs.Screen
        name="setting"
        options={{ title: "Settings", tabBarLabel: "Settings", tabBarAccessibilityLabel: "Settings" }}
      />
    </Tabs>
  );
}

import React, { useEffect } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../auth/AuthProvider";
import { getMyProfile } from "../profile/services/profileApi";
import { Text } from "../../shared/ui/native";
import DashboardActionGrid from "./components/DashboardActionGrid";
import DashboardHeader from "./components/DashboardHeader";
import DashboardMetricsRow from "./components/DashboardMetricsRow";
import DashboardCarouselPlaceholder from "./components/DashboardCarouselPlaceholder";
import {
  PRIMARY_DASHBOARD_ACTION,
  SECONDARY_DASHBOARD_ACTIONS,
  type DashboardRoute,
} from "./data/dashboardActions";

export default function DashboardScreen() {
  const router = useRouter();
  const { user, apiRequest, syncAccount } = useAuth();

  useEffect(() => {
    let active = true;
    void getMyProfile(apiRequest).then((profile) => {
      if (active) syncAccount({ ...profile.account, avatarUrl: profile.avatarUrl, avatarUpdatedAt: profile.avatarUpdatedAt });
    }).catch(() => {
      // Keep the dashboard usable when object storage is temporarily offline.
    });
    return () => { active = false; };
  }, [apiRequest, syncAccount]);

  const displayName = user?.displayName?.trim() || "MDATE User";
  const secondaryLabel = user?.email?.trim() || "@mdate_user";
  const handleActionPress = (href: DashboardRoute) => { router.push(href); };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <DashboardHeader
          displayName={displayName}
          secondaryLabel={secondaryLabel}
          avatarUrl={user?.avatarUrl}
          onProfilePress={() => router.push("/profile")}
        />

        {/* Primary Action — Start Training (§3.6 & §4.1) */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={PRIMARY_DASHBOARD_ACTION.title}
          accessibilityHint="Begins therapy training modules"
          onPress={() => handleActionPress(PRIMARY_DASHBOARD_ACTION.href)}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}
        >
          <View style={styles.primaryIconWrapper}>
            <Ionicons name={PRIMARY_DASHBOARD_ACTION.icon} size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.primaryButtonText}>{PRIMARY_DASHBOARD_ACTION.title}</Text>
          <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
        </Pressable>

        <View style={styles.outerCard}>
          <DashboardCarouselPlaceholder />
          <DashboardMetricsRow />
          <Text style={styles.sectionSubtitle}>Quick Navigation</Text>
          <DashboardActionGrid actions={SECONDARY_DASHBOARD_ACTIONS} onActionPress={handleActionPress} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { padding: 16, paddingBottom: 40, gap: 16 },
  primaryButton: {
    minHeight: 64,
    borderRadius: 20,
    backgroundColor: "#174EA6",
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#174EA6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  primaryIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    flex: 1,
    marginLeft: 14,
  },
  outerCard: {
    borderWidth: 1.5,
    borderColor: "#DFE7F0",
    borderRadius: 24,
    padding: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 4,
  },
});

import React, { useEffect } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../auth/AuthProvider";
import { getMyProfile } from "../profile/services/profileApi";
import DashboardActionGrid from "./components/DashboardActionGrid";
import DashboardHeader from "./components/DashboardHeader";
import DashboardMetricsRow from "./components/DashboardMetricsRow";
import DashboardCarouselPlaceholder from "./components/DashboardCarouselPlaceholder";
import { DASHBOARD_ACTIONS, type DashboardRoute } from "./data/dashboardActions";

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
        <View style={styles.outerCard}>
          <DashboardCarouselPlaceholder />
          <DashboardMetricsRow />
          <DashboardActionGrid actions={DASHBOARD_ACTIONS} onActionPress={handleActionPress} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8F9FA" },
  container: { padding: 16, paddingBottom: 40 },
  outerCard: {
    borderWidth: 1.5, borderColor: "#ccc", borderRadius: 24, padding: 16,
    backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
});

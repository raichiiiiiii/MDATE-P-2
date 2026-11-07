import { Image, Pressable, StyleSheet, Text, View } from "react-native";

type DashboardHeaderProps = {
  displayName: string;
  secondaryLabel: string;
  avatarUrl?: string | null;
  onProfilePress: () => void;
};

const PROFILE_IMAGE_PLACEHOLDER = "https://via.placeholder.com/100";

export default function DashboardHeader({ displayName, secondaryLabel, avatarUrl, onProfilePress }: DashboardHeaderProps) {
  return (
    <View style={styles.headerSection}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open profile management" onPress={onProfilePress} style={({ pressed }) => [styles.profilePressable, pressed && styles.pressed]}>
        <Image source={{ uri: avatarUrl || PROFILE_IMAGE_PLACEHOLDER }} style={styles.profileImage} />
      </Pressable>
      <View style={styles.userInfo}>
        <Text style={styles.displayName} numberOfLines={2}>{displayName}</Text>
        <Text style={styles.username} numberOfLines={1}>{secondaryLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSection: { flexDirection: "row", alignItems: "center", marginBottom: 20, paddingHorizontal: 4 },
  profilePressable: { width: 75, height: 75, borderRadius: 37.5 },
  profileImage: { width: 75, height: 75, borderRadius: 37.5, borderWidth: 2, borderColor: "#333", backgroundColor: "#ccc" },
  pressed: { opacity: 0.72 },
  userInfo: { marginLeft: 16, flex: 1 },
  displayName: { fontSize: 20, fontWeight: "bold", color: "#111" },
  username: { fontSize: 14, color: "#666", marginTop: 2 },
});

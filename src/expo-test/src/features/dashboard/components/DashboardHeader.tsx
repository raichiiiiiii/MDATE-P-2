import { Image, StyleSheet, Text, View } from "react-native";

type DashboardHeaderProps = {
  displayName: string;
  secondaryLabel: string;
};

const PROFILE_IMAGE_PLACEHOLDER = "https://via.placeholder.com/100";

export default function DashboardHeader({ displayName, secondaryLabel }: DashboardHeaderProps) {
  return (
    <View style={styles.headerSection}>
      <Image source={{ uri: PROFILE_IMAGE_PLACEHOLDER }} style={styles.profileImage} />
      <View style={styles.userInfo}>
        <Text style={styles.displayName} numberOfLines={2}>{displayName}</Text>
        <Text style={styles.username} numberOfLines={1}>{secondaryLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  profileImage: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    borderWidth: 2,
    borderColor: "#333",
    backgroundColor: "#ccc",
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  displayName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111",
  },
  username: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
});

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.content}>
        <Text style={styles.brand}>MDATE</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Welcome back
        </Text>
        <Text style={styles.description}>
          Your speech practice space. Take your time and work at your own pace.
        </Text>

        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.cardTitle}>
            Ready to practise?
          </Text>
          <Text style={styles.cardDescription}>
            Open your training area to see the exercises available to you.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open training modules"
            onPress={() => router.push("/modules")}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>View training</Text>
          </Pressable>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>A reminder</Text>
          <Text style={styles.noteText}>
            There is no need to rush. You can take a break whenever you need one.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 36,
    backgroundColor: "#F8FAFC",
  },
  content: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  brand: {
    color: "#1D4ED8",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 20,
  },
  title: {
    color: "#0F172A",
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
    marginBottom: 12,
  },
  description: {
    color: "#475569",
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 28,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#CBD5E1",
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
    marginBottom: 18,
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "800",
    marginBottom: 8,
  },
  cardDescription: {
    color: "#475569",
    fontSize: 16,
    lineHeight: 25,
    marginBottom: 20,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 12,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "800",
  },
  noteCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 18,
  },
  noteTitle: {
    color: "#1E3A8A",
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "800",
    marginBottom: 6,
  },
  noteText: {
    color: "#1E40AF",
    fontSize: 16,
    lineHeight: 25,
  },
});

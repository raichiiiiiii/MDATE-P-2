import { Image, StyleSheet, View } from "react-native";

export default function SplashIcon() {
  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        <Image
          source={require("../../../../assets/icon.png")}
          style={styles.image}
          resizeMode="contain"
          accessibilityLabel="MDATE app icon"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DBEAFE",
    marginBottom: 18,
  },
  inner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 80,
    height: 80,
  },
});

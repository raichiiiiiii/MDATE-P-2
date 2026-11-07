import { Image, StyleSheet, View } from "react-native";

export default function SplashIcon() {
  return (
    <View style={styles.outer}>
      <Image
        source={require("../../../../assets/icon.png")}
        style={styles.image}
        resizeMode="contain"
        accessibilityLabel="MDATE app logo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: "#2D3748",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 92,
    height: 92,
  },
});

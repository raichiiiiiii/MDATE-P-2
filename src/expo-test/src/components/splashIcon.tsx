import {
  Image,
  StyleSheet,
  type ImageSourcePropType,
  type StyleProp,
  type ImageStyle,
} from "react-native";

type SplashIconProps = {
  size?: number;
  source?: ImageSourcePropType;
  accessibilityLabel?: string;
  style?: StyleProp<ImageStyle>;
  animatedStyle?: StyleProp<ImageStyle>;
  [key: string]: unknown;
};

export default function SplashIcon({
  size = 96,
  source,
  accessibilityLabel = "MDATE app icon",
  style,
  animatedStyle,
}: SplashIconProps) {
  return (
    <Image
      accessibilityLabel={accessibilityLabel}
      source={source ?? require("../../assets/icon.png")}
      resizeMode="contain"
      style={[styles.image, { width: size, height: size }, style, animatedStyle]}
    />
  );
}

const styles = StyleSheet.create({ image: { alignSelf: "center" } });

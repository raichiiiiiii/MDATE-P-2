import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

/** A looping scale animation for the MDATE splash icon. */
export default function useSplashIconAnimation(): Animated.Value {
  const animationValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animationValue, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animationValue, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [animationValue]);

  return animationValue;
}

import SplashScreen from "../src/features/splash/SplashScreen";

/**
 * The root index is the entry/waiting screen only.
 * AuthFlowProvider and RootNavigator decide which route group is active.
 */
export default function IndexScreen() {
  return <SplashScreen />;
}

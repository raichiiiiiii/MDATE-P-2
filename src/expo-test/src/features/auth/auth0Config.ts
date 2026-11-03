import { Platform } from "react-native";

/**
 * Public Auth0 configuration for the client application.
 * These values are not secrets; never put a client secret in the Expo app.
 */
export const AUTH0_DOMAIN =
  process.env.EXPO_PUBLIC_AUTH0_DOMAIN ?? "mdate.au.auth0.com";

export const AUTH0_AUDIENCE =
  process.env.EXPO_PUBLIC_AUTH0_AUDIENCE ?? "https://api.mdate.com";

/**
 * Must exactly match the Auth0 Database Connection enabled for the
 * MDATE application in the Auth0 Dashboard.
 */
export const AUTH0_DATABASE_CONNECTION =
  process.env.EXPO_PUBLIC_AUTH0_DATABASE_CONNECTION ??
  "Username-Password-Authentication";

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_WEB_CLIENT_ID;
const NATIVE_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_NATIVE_CLIENT_ID;

const KNOWN_WEB_CLIENT_ID = "ju9fuxzqxVmQQNSygtJyhyAKF5FYui33";

export const AUTH0_CLIENT_ID =
  Platform.OS === "web"
    ? WEB_CLIENT_ID ?? KNOWN_WEB_CLIENT_ID
    : NATIVE_CLIENT_ID ?? "";

export const AUTH0_CUSTOM_SCHEME = "mdateauth0";

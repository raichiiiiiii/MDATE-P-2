// Compatibility shim for any screens not yet migrated to the useAuth() name.
// This file contains no Auth0 SDK dependency and delegates to the first-party provider.
export { AuthProvider as AuthFlowProvider, useAuth as useAuthFlow } from "./AuthProvider";
export type { AuthMode, AuthPhase } from "./AuthProvider";

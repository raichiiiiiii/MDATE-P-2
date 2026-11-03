/**
 * Auth0 Action: Post Login
 * Add this Action to the Auth0 Login flow.
 *
 * These namespaced values are read by MDATE Express only after the access
 * token has passed JWT signature, issuer, audience and expiry validation.
 */
exports.onExecutePostLogin = async (event, api) => {
  const namespace = "https://api.mdate.com/claims/";

  if (event.user.email) {
    api.accessToken.setCustomClaim(namespace + "email", event.user.email);
  }

  api.accessToken.setCustomClaim(
    namespace + "email_verified",
    event.user.email_verified === true
  );
};

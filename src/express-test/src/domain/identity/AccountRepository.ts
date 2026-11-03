import type {
  AccountSnapshot,
  AccountSetupInput,
  Auth0IdentityClaims,
  BootstrapResult,
} from "./Account.js";

export interface AccountRepository {
  bootstrap(
    auth0Subject: string,
    identity?: Auth0IdentityClaims,
  ): Promise<BootstrapResult>;

  findByAuth0Subject(auth0Subject: string): Promise<AccountSnapshot | null>;

  completeSetup(
    auth0Subject: string,
    input: AccountSetupInput,
  ): Promise<AccountSnapshot | null>;
}

import type {
  AccountSnapshot,
  AccountSetupInput,
  BootstrapResult,
} from "./Account.js";

export interface AccountRepository {
  bootstrap(auth0Subject: string): Promise<BootstrapResult>;

  findByAuth0Subject(
    auth0Subject: string
  ): Promise<AccountSnapshot | null>;

  completeSetup(
    auth0Subject: string,
    input: AccountSetupInput
  ): Promise<AccountSnapshot | null>;
}

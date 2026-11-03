import type { Auth0IdentityClaims } from "../../domain/identity/Account.js";
import type { AccountRepository } from "../../domain/identity/AccountRepository.js";

export class BootstrapAccount {
  constructor(private readonly accounts: AccountRepository) {}

  execute(auth0Subject: string, identity?: Auth0IdentityClaims) {
    return this.accounts.bootstrap(auth0Subject, identity);
  }
}

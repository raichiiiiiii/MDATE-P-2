import type { AccountRepository } from "../../domain/identity/AccountRepository.js";

export class BootstrapAccount {
  constructor(private readonly accounts: AccountRepository) {}

  execute(auth0Subject: string) {
    return this.accounts.bootstrap(auth0Subject);
  }
}

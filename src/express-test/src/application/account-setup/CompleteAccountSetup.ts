import type { AccountSetupInput } from "../../domain/identity/Account.js";
import type { AccountRepository } from "../../domain/identity/AccountRepository.js";

export class CompleteAccountSetup {
  constructor(private readonly accounts: AccountRepository) {}

  execute(auth0Subject: string, input: AccountSetupInput) {
    return this.accounts.completeSetup(auth0Subject, input);
  }
}

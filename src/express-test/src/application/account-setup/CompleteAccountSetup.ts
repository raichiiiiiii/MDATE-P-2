import type { AccountSetupInput } from "../../domain/identity/Account.js";
import type { AccountRepository } from "../../domain/identity/AccountRepository.js";

export class CompleteAccountSetup {
  constructor(private readonly accounts: AccountRepository) {}

  execute(userId: string, input: AccountSetupInput) {
    return this.accounts.completeSetup(userId, input);
  }
}

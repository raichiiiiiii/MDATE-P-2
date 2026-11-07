import type { AccountPreferencesInput } from "../../domain/identity/Account.js";
import type { AccountRepository } from "../../domain/identity/AccountRepository.js";

/** Updates a complete preferences snapshot without changing account identity or setup state. */
export class UpdateAccountPreferences {
  constructor(private readonly accounts: AccountRepository) {}

  execute(userId: string, input: AccountPreferencesInput) {
    return this.accounts.updatePreferences(userId, input);
  }
}

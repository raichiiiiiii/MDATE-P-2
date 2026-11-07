import type { AccountPreferencesInput, AccountSnapshot, AccountSetupInput } from "./Account.js";

export interface AccountRepository {
  findById(userId: string): Promise<AccountSnapshot | null>;
  completeSetup(userId: string, input: AccountSetupInput): Promise<AccountSnapshot | null>;
  updatePreferences(userId: string, input: AccountPreferencesInput): Promise<AccountSnapshot | null>;
}

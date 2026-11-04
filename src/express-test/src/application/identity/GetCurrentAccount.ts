import type { AccountRepository } from "../../domain/identity/AccountRepository.js";

export class GetCurrentAccount {
  constructor(private readonly accounts: AccountRepository) {}

  execute(userId: string) {
    return this.accounts.findById(userId);
  }
}

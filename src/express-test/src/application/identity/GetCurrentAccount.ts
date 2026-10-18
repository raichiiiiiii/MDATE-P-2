import type { AccountRepository } from "../../domain/identity/AccountRepository.js";

export class GetCurrentAccount {
  constructor(private readonly accounts: AccountRepository) {}

  execute(auth0Subject: string) {
    return this.accounts.findByAuth0Subject(auth0Subject);
  }
}

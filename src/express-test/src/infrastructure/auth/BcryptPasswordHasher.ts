import { compare, hash } from "bcryptjs";
import type { PasswordHasher } from "../../domain/identity/PasswordHasher.js";

const BCRYPT_COST = 12;

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return hash(password, BCRYPT_COST);
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    return compare(password, passwordHash);
  }
}

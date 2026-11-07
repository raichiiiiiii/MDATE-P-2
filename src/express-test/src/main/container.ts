import { env } from "../shared/configuration/env.js";
import { CompleteAccountSetup } from "../application/account-setup/CompleteAccountSetup.js";
import { UpdateAccountPreferences } from "../application/preferences/UpdateAccountPreferences.js";
import { GetCurrentAccount } from "../application/identity/GetCurrentAccount.js";
import { IdentityService } from "../application/identity/IdentityService.js";
import { BcryptPasswordHasher } from "../infrastructure/auth/BcryptPasswordHasher.js";
import { JwtAccessTokenService } from "../infrastructure/auth/JwtAccessTokenService.js";
import { SmtpPasswordResetMailer } from "../infrastructure/auth/SmtpPasswordResetMailer.js";
import { PgIdentityRepository } from "../infrastructure/persistence/postgres/PgIdentityRepository.js";
import { PgAccountRepository } from "../infrastructure/persistence/postgres/PgAccountRepository.js";
import { PgTrainingContentRepository } from "../infrastructure/persistence/postgres/PgTrainingContentRepository.js";
import { pool } from "../infrastructure/persistence/postgres/pgPool.js";
import { TrainingContentService } from "../application/training/TrainingContentService.js";

const accountRepository = new PgAccountRepository(pool);
const identityRepository = new PgIdentityRepository(pool);
const trainingContentRepository = new PgTrainingContentRepository(pool);

export const getCurrentAccount = new GetCurrentAccount(accountRepository);
export const completeAccountSetup = new CompleteAccountSetup(accountRepository);
export const updateAccountPreferences = new UpdateAccountPreferences(accountRepository);
export const trainingContent = new TrainingContentService(trainingContentRepository);
export const accessTokenService = new JwtAccessTokenService();
export const identityService = new IdentityService(
  identityRepository,
  accountRepository,
  new BcryptPasswordHasher(),
  accessTokenService,
  new SmtpPasswordResetMailer(),
  {
    refreshTokenTtlDays: env.REFRESH_TOKEN_TTL_DAYS,
    passwordResetTtlMinutes: 15,
    passwordResetBaseUrl: env.PASSWORD_RESET_BASE_URL,
  },
);

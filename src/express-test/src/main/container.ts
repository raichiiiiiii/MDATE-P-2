import { env } from "../shared/configuration/env.js";
import { CompleteAccountSetup } from "../application/account-setup/CompleteAccountSetup.js";
import { UpdateAccountPreferences } from "../application/preferences/UpdateAccountPreferences.js";
import { GetCurrentAccount } from "../application/identity/GetCurrentAccount.js";
import { IdentityService } from "../application/identity/IdentityService.js";
import { AccountSecurityService } from "../application/security/AccountSecurityService.js";
import { ProfileService } from "../application/profile/ProfileService.js";
import { BcryptPasswordHasher } from "../infrastructure/auth/BcryptPasswordHasher.js";
import { JwtAccessTokenService } from "../infrastructure/auth/JwtAccessTokenService.js";
import { SmtpPasswordResetMailer } from "../infrastructure/auth/SmtpPasswordResetMailer.js";
import { SmtpEmailChangeMailer } from "../infrastructure/auth/SmtpEmailChangeMailer.js";
import { PgIdentityRepository } from "../infrastructure/persistence/postgres/PgIdentityRepository.js";
import { PgAccountRepository } from "../infrastructure/persistence/postgres/PgAccountRepository.js";
import { PgAccountSecurityRepository } from "../infrastructure/persistence/postgres/PgAccountSecurityRepository.js";
import { PgProfileRepository } from "../infrastructure/persistence/postgres/PgProfileRepository.js";
import { PgTrainingContentRepository } from "../infrastructure/persistence/postgres/PgTrainingContentRepository.js";
import { MinioObjectStorage } from "../infrastructure/storage/minio/MinioObjectStorage.js";
import { pool } from "../infrastructure/persistence/postgres/pgPool.js";
import { TrainingContentService } from "../application/training/TrainingContentService.js";

const accountRepository = new PgAccountRepository(pool);
const identityRepository = new PgIdentityRepository(pool);
const accountSecurityRepository = new PgAccountSecurityRepository(pool);
const profileRepository = new PgProfileRepository(pool);
const trainingContentRepository = new PgTrainingContentRepository(pool);

// MinIO is optional during local development. Profile text fields remain usable
// without it; avatar-upload operations return the service's 503 response.
const objectStorage = env.MINIO_APP_USER && env.MINIO_APP_PASSWORD
  ? MinioObjectStorage.fromEnvironment()
  : null;

// Share the same concrete password hasher across identity and security use cases.
const passwordHasher = new BcryptPasswordHasher();
const emailChangeMailer = new SmtpEmailChangeMailer();

export const getCurrentAccount = new GetCurrentAccount(accountRepository);
export const completeAccountSetup = new CompleteAccountSetup(accountRepository);
export const updateAccountPreferences = new UpdateAccountPreferences(accountRepository);
export const trainingContent = new TrainingContentService(trainingContentRepository);
export const accessTokenService = new JwtAccessTokenService();

export const identityService = new IdentityService(
  identityRepository,
  accountRepository,
  passwordHasher,
  accessTokenService,
  new SmtpPasswordResetMailer(),
  {
    refreshTokenTtlDays: env.REFRESH_TOKEN_TTL_DAYS,
    passwordResetTtlMinutes: 15,
    passwordResetBaseUrl: env.PASSWORD_RESET_BASE_URL,
  },
);

export const accountSecurityService = new AccountSecurityService(
  accountSecurityRepository,
  passwordHasher,
  emailChangeMailer,
  env.EMAIL_CHANGE_BASE_URL,
);

export const profileService = new ProfileService(
  accountRepository,
  profileRepository,
  objectStorage,
  env.MINIO_PRESIGNED_URL_TTL_SECONDS,
);

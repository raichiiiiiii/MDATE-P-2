import { BootstrapAccount } from "../application/identity/BootstrapAccount.js";
import { GetCurrentAccount } from "../application/identity/GetCurrentAccount.js";
import { CompleteAccountSetup } from "../application/account-setup/CompleteAccountSetup.js";
import { TrainingContentService } from "../application/training/TrainingContentService.js";

import { PgAccountRepository } from "../infrastructure/persistence/postgres/PgAccountRepository.js";
import { PgTrainingContentRepository } from "../infrastructure/persistence/postgres/PgTrainingContentRepository.js";
import { pool } from "../infrastructure/persistence/postgres/pgPool.js";

const accountRepository = new PgAccountRepository(pool);
const trainingContentRepository = new PgTrainingContentRepository(pool);

export const bootstrapAccount = new BootstrapAccount(accountRepository);
export const getCurrentAccount = new GetCurrentAccount(accountRepository);
export const completeAccountSetup = new CompleteAccountSetup(accountRepository);
export const trainingContent = new TrainingContentService(trainingContentRepository);

import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import {
  claimWalletRewardController,
  getMyWalletController,
  getWalletTransactionsController,
  spendWalletCoinsController,
} from "../controllers/walletController.js";

export const walletRoutes = Router();
walletRoutes.use("/me/wallet", requireAuth, requireActiveUser);
walletRoutes.get("/me/wallet", getMyWalletController);
walletRoutes.get("/me/wallet/transactions", getWalletTransactionsController);
walletRoutes.post("/me/wallet/rewards/claim", claimWalletRewardController);
walletRoutes.post("/me/wallet/spend", spendWalletCoinsController);

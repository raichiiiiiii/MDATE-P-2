import type { RequestHandler } from "express";
import { trainingRewards } from "../../container.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function singleParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

export const getModuleRewardTreeController: RequestHandler = async (req, res, next) => {
  const moduleId = singleParam(req.params.moduleId);
  if (!moduleId || !UUID_PATTERN.test(moduleId)) {
    res.status(400).json({ error: "INVALID_ID", message: "A valid module ID is required." });
    return;
  }
  try {
    const tree = await trainingRewards.getModuleRewardTree(moduleId);
    if (!tree) {
      res.status(404).json({ error: "MODULE_NOT_FOUND", message: "The published module could not be found." });
      return;
    }
    res.json({ data: tree });
  } catch (error) { next(error); }
};

export const getSubmoduleRewardTreeController: RequestHandler = async (req, res, next) => {
  const submoduleId = singleParam(req.params.submoduleId);
  if (!submoduleId || !UUID_PATTERN.test(submoduleId)) {
    res.status(400).json({ error: "INVALID_ID", message: "A valid submodule ID is required." });
    return;
  }
  try {
    const tree = await trainingRewards.getSubmoduleRewardTree(submoduleId);
    const submodule = tree?.submodules.find((item) => item.id === submoduleId);
    if (!tree || !submodule) {
      res.status(404).json({ error: "SUBMODULE_NOT_FOUND", message: "The published submodule could not be found." });
      return;
    }
    res.json({ data: { module: tree.module, submodule, moduleQuestionCount: tree.questionCount } });
  } catch (error) { next(error); }
};

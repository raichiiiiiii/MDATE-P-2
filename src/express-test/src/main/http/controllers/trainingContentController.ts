import { resolve } from "node:path";
import type { RequestHandler } from "express";

import { trainingContent } from "../../container.js";
import { env } from "../../../shared/configuration/env.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Express 5 parameter typings may allow repeated parameters as string[]. */
function getSingleParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

function validId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function invalidId(res: Parameters<RequestHandler>[1], label: string) {
  res.status(400).json({
    error: "invalid_id",
    message: `${label} must be a valid UUID.`,
  });
}

export const listModulesController: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ data: await trainingContent.listPublishedModules() });
  } catch (error) {
    next(error);
  }
};

export const getModuleController: RequestHandler = async (req, res, next) => {
  const moduleId = getSingleParam(req.params.moduleId);
  if (moduleId === null || !validId(moduleId)) {
    invalidId(res, "moduleId");
    return;
  }
  try {
    const module = await trainingContent.getPublishedModule(moduleId);
    if (!module) {
      res.status(404).json({ error: "module_not_found", message: "The published module was not found." });
      return;
    }
    res.json({ data: module });
  } catch (error) {
    next(error);
  }
};

export const listQSetsController: RequestHandler = async (req, res, next) => {
  const submoduleId = getSingleParam(req.params.submoduleId);
  if (submoduleId === null || !validId(submoduleId)) {
    invalidId(res, "submoduleId");
    return;
  }
  try {
    const result = await trainingContent.listQSets(submoduleId);
    if (!result) {
      res.status(404).json({ error: "submodule_not_found", message: "The published exercise type was not found." });
      return;
    }
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};

export const getQSetController: RequestHandler = async (req, res, next) => {
  const qSetId = getSingleParam(req.params.qSetId);
  if (qSetId === null || !validId(qSetId)) {
    invalidId(res, "qSetId");
    return;
  }
  try {
    const qSet = await trainingContent.getQSet(qSetId);
    if (!qSet) {
      res.status(404).json({ error: "q_set_not_found", message: "The published practice set was not found." });
      return;
    }
    res.json({
      data: {
        ...qSet,
        questions: qSet.questions.map((question) => ({
          ...question,
          media: question.media.map((media) => ({
            ...media,
            url: `/api/v1/media/${media.id}`,
          })),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMediaController: RequestHandler = async (req, res, next) => {
  const assetId = getSingleParam(req.params.assetId);
  if (assetId === null || !validId(assetId)) {
    invalidId(res, "assetId");
    return;
  }
  try {
    const asset = await trainingContent.getMediaAsset(assetId);
    if (!asset) {
      res.status(404).json({ error: "media_not_found", message: "The published media asset was not found." });
      return;
    }

    res.type(asset.mimeType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    // Helmet defaults to same-origin resource policy; published generic
    // images must be displayable from Expo Web on a different local port.
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.sendFile(asset.storageKey, {
      root: resolve(env.MEDIA_STORAGE_DIR),
      dotfiles: "deny",
    }, (error) => {
      if (!error || res.headersSent) return;
      if ("statusCode" in error && error.statusCode === 404) {
        res.status(404).json({ error: "media_file_missing", message: "The media record exists, but its local file is missing." });
        return;
      }
      next(error);
    });
  } catch (error) {
    next(error);
  }
};

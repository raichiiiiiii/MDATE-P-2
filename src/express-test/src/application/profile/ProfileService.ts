import { randomUUID } from "node:crypto";
import type { AccountRepository } from "../../domain/identity/AccountRepository.js";
import type { ObjectStorage } from "../ports/ObjectStorage.js";
import type { ProfileRepository } from "../../domain/profile/ProfileRepository.js";

const BUCKET = "mdate-assets" as const;
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class ProfileNotFoundError extends Error {}
export class AvatarStorageUnavailableError extends Error {}
export class InvalidAvatarError extends Error {}
export class AvatarUploadExpiredError extends Error {}

function detectedImageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}

export class ProfileService {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly profiles: ProfileRepository,
    private readonly storage: ObjectStorage | null,
    private readonly uploadUrlTtlSeconds = 300,
  ) {}

  private requireStorage(): ObjectStorage {
    if (!this.storage) throw new AvatarStorageUnavailableError("Avatar storage is not configured. Configure MinIO before uploading a profile picture.");
    return this.storage;
  }

  async getProfile(userId: string) {
    const [account, avatar] = await Promise.all([
      this.accounts.findById(userId),
      this.profiles.findAvatar(userId),
    ]);
    if (!account) throw new ProfileNotFoundError("The account could not be found.");
    let avatarUrl: string | null = null;
    if (avatar?.storageKey && this.storage) {
      avatarUrl = await this.storage.createPresignedDownloadUrl({ bucket: BUCKET, key: avatar.storageKey, expiresInSeconds: 300 });
    }
    return {
      account,
      avatarUrl,
      avatarUpdatedAt: avatar?.updatedAt ?? null,
    };
  }

  async updateDisplayName(userId: string, displayName: string) {
    await this.profiles.updateDisplayName(userId, displayName.trim());
    const account = await this.accounts.findById(userId);
    if (!account) throw new ProfileNotFoundError("The account could not be found.");
    return { account };
  }

  async createAvatarUpload(userId: string, contentType: string, sizeBytes: number) {
    const storage = this.requireStorage();
    if (!ALLOWED_TYPES.has(contentType) || !Number.isInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_AVATAR_BYTES) {
      throw new InvalidAvatarError("Choose a JPEG, PNG or WebP image no larger than 2 MB.");
    }
    const id = randomUUID();
    const extension = EXTENSIONS[contentType]!;
    const objectKey = `avatars/${userId}/${id}.${extension}`;
    const expiresAt = new Date(Date.now() + this.uploadUrlTtlSeconds * 1000);
    await this.profiles.createAvatarUploadIntent({ id, userId, objectKey, contentType, expectedSizeBytes: sizeBytes, expiresAt });
    try {
      const uploadUrl = await storage.createPresignedUploadUrl({
        bucket: BUCKET,
        key: objectKey,
        contentType,
        expiresInSeconds: this.uploadUrlTtlSeconds,
      });
      return { uploadId: id, uploadUrl, expiresAt: expiresAt.toISOString(), headers: { "Content-Type": contentType } };
    } catch (error) {
      await this.profiles.invalidateAvatarUploadIntent(id, userId).catch(() => undefined);
      throw error;
    }
  }

  async confirmAvatarUpload(userId: string, uploadId: string) {
    const storage = this.requireStorage();
    const intent = await this.profiles.findAvatarUploadIntent(uploadId, userId);
    if (!intent || intent.usedAt) {
      throw new AvatarUploadExpiredError("This avatar upload is invalid or has already been used. Please choose the image again.");
    }
    if (new Date(intent.expiresAt).getTime() <= Date.now()) {
      await storage.deleteObject({ bucket: BUCKET, key: intent.objectKey }).catch(() => undefined);
      await this.profiles.invalidateAvatarUploadIntent(uploadId, userId);
      throw new AvatarUploadExpiredError("This avatar upload has expired. Please choose the image again.");
    }
    let object: { body: Uint8Array; contentType: string | null } | null;
    try {
      object = await storage.getObjectBytes({ bucket: BUCKET, key: intent.objectKey, maxBytes: MAX_AVATAR_BYTES });
    } catch (error) {
      if (error instanceof Error && error.message === "Stored object exceeds the allowed size.") {
        await storage.deleteObject({ bucket: BUCKET, key: intent.objectKey }).catch(() => undefined);
        await this.profiles.invalidateAvatarUploadIntent(uploadId, userId);
        throw new InvalidAvatarError("The uploaded image exceeds the 2 MB limit.");
      }
      throw error;
    }
    if (!object) throw new InvalidAvatarError("The uploaded image could not be found. Please try again.");
    const actualType = detectedImageType(object.body);
    if (!actualType || actualType !== intent.contentType || object.contentType !== intent.contentType || object.body.byteLength !== intent.expectedSizeBytes) {
      await storage.deleteObject({ bucket: BUCKET, key: intent.objectKey }).catch(() => undefined);
      await this.profiles.invalidateAvatarUploadIntent(uploadId, userId);
      throw new InvalidAvatarError("The uploaded file is not a valid image matching the selected format and size.");
    }
    const previousKey = await this.profiles.activateAvatar({ uploadIntentId: uploadId, userId, contentType: actualType });
    if (previousKey && previousKey !== intent.objectKey) {
      await storage.deleteObject({ bucket: BUCKET, key: previousKey }).catch((error) => console.error("[MDATE] Previous avatar cleanup failed:", error));
    }
    return this.getProfile(userId);
  }

  async removeAvatar(userId: string) {
    const previousKey = await this.profiles.removeAvatar(userId);
    if (previousKey && this.storage) {
      await this.storage.deleteObject({ bucket: BUCKET, key: previousKey })
        .catch((error) => console.error("[MDATE] Avatar cleanup failed:", error));
    } else if (previousKey) {
      console.warn("[MDATE] Avatar metadata was cleared, but MinIO is unavailable; the private object needs cleanup later.");
    }
    return this.getProfile(userId);
  }
}

export interface AvatarUploadIntent {
  id: string;
  userId: string;
  objectKey: string;
  contentType: string;
  expectedSizeBytes: number;
  expiresAt: string;
  usedAt: string | null;
}

export interface ProfileRepository {
  findAvatar(userId: string): Promise<{
    storageKey: string | null;
    contentType: string | null;
    updatedAt: string | null;
  } | null>;
  updateDisplayName(userId: string, displayName: string): Promise<void>;
  createAvatarUploadIntent(input: {
    id: string;
    userId: string;
    objectKey: string;
    contentType: string;
    expectedSizeBytes: number;
    expiresAt: Date;
  }): Promise<void>;
  findAvatarUploadIntent(id: string, userId: string): Promise<AvatarUploadIntent | null>;
  activateAvatar(input: {
    uploadIntentId: string;
    userId: string;
    contentType: string;
  }): Promise<string | null>;
  removeAvatar(userId: string): Promise<string | null>;
  invalidateAvatarUploadIntent(id: string, userId: string): Promise<void>;
}

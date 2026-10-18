import type { Readable } from "node:stream";

export type MdateStorageBucket = "mdate-audio" | "mdate-assets" | "mdate-exports";
export type ObjectBody = Uint8Array | string | Readable;

/** Application-facing object-storage contract; avoids leaking the S3 SDK upward. */
export interface ObjectStorage {
  putObject(input: {
    bucket: MdateStorageBucket;
    key: string;
    body: ObjectBody;
    contentType: string;
    metadata?: Record<string, string>;
  }): Promise<void>;
  createPresignedUploadUrl(input: {
    bucket: MdateStorageBucket;
    key: string;
    contentType: string;
    expiresInSeconds?: number;
  }): Promise<string>;
  createPresignedDownloadUrl(input: {
    bucket: MdateStorageBucket;
    key: string;
    expiresInSeconds?: number;
  }): Promise<string>;
  deleteObject(input: { bucket: MdateStorageBucket; key: string }): Promise<void>;
}

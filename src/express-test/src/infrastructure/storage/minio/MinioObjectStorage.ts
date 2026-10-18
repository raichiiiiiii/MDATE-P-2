import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { ObjectStorage, MdateStorageBucket } from "../../../application/ports/ObjectStorage.js";
import type { ObjectBody } from "../../../application/ports/ObjectStorage.js";

function defaultExpirySeconds(): number {
  const configured = Number(process.env.MINIO_PRESIGNED_URL_TTL_SECONDS || 300);
  return Number.isInteger(configured) && configured >= 30 && configured <= 900
    ? configured
    : 300;
}

function assertKey(key: string): void {
  if (!key || key.trim() !== key || key.startsWith("/") || key.includes("\\") || key.includes("\0")) {
    throw new Error("The object key is invalid.");
  }
  const segments = key.split("/");
  if (segments.some((segment) => segment === ".." || segment === ".")) {
    throw new Error("The object key must not contain . or .. path segments.");
  }
}

function assertExpiry(seconds: number): void {
  if (!Number.isInteger(seconds) || seconds < 30 || seconds > 900) {
    throw new Error("Presigned URL expiry must be between 30 and 900 seconds.");
  }
}

function resolveBucket(bucket: MdateStorageBucket): string {
  const configured: Record<MdateStorageBucket, string> = {
    "mdate-audio": process.env.MINIO_BUCKET_AUDIO || "mdate-audio",
    "mdate-assets": process.env.MINIO_BUCKET_ASSETS || "mdate-assets",
    "mdate-exports": process.env.MINIO_BUCKET_EXPORTS || "mdate-exports",
  };
  return configured[bucket];
}

export class MinioObjectStorage implements ObjectStorage {
  constructor(private readonly client: S3Client) {}

  static fromEnvironment(): MinioObjectStorage {
    const endpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000";
    const appUser = process.env.MINIO_APP_USER;
    const appPassword = process.env.MINIO_APP_PASSWORD;
    const region = process.env.MINIO_REGION || "us-east-1";

    if (!appUser || !appPassword) {
      throw new Error("MINIO_APP_USER and MINIO_APP_PASSWORD must be configured in the Express environment.");
    }
    let parsedEndpoint: URL;
    try {
      parsedEndpoint = new URL(endpoint);
    } catch {
      throw new Error("MINIO_ENDPOINT must be a valid http(s) URL.");
    }
    if (parsedEndpoint.protocol !== "http:" && parsedEndpoint.protocol !== "https:") {
      throw new Error("MINIO_ENDPOINT must use http or https.");
    }

    return new MinioObjectStorage(new S3Client({
      endpoint: parsedEndpoint.toString().replace(/\/$/, ""),
      region,
      forcePathStyle: true,
      credentials: { accessKeyId: appUser, secretAccessKey: appPassword },
    }));
  }

  async putObject(input: {
    bucket: MdateStorageBucket;
    key: string;
    body: ObjectBody;
    contentType: string;
    metadata?: Record<string, string>;
  }): Promise<void> {
    assertKey(input.key);
    if (!input.contentType || input.contentType.trim() === "") {
      throw new Error("contentType is required.");
    }
    await this.client.send(new PutObjectCommand({
      Bucket: resolveBucket(input.bucket),
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      ...(input.metadata ? { Metadata: input.metadata } : {}),
    }));
  }

  async createPresignedUploadUrl(input: {
    bucket: MdateStorageBucket;
    key: string;
    contentType: string;
    expiresInSeconds?: number;
  }): Promise<string> {
    assertKey(input.key);
    const expiresIn = input.expiresInSeconds ?? defaultExpirySeconds();
    assertExpiry(expiresIn);
    return getSignedUrl(this.client, new PutObjectCommand({
      Bucket: resolveBucket(input.bucket),
      Key: input.key,
      ContentType: input.contentType,
    }), { expiresIn });
  }

  async createPresignedDownloadUrl(input: {
    bucket: MdateStorageBucket;
    key: string;
    expiresInSeconds?: number;
  }): Promise<string> {
    assertKey(input.key);
    const expiresIn = input.expiresInSeconds ?? defaultExpirySeconds();
    assertExpiry(expiresIn);
    return getSignedUrl(this.client, new GetObjectCommand({
      Bucket: resolveBucket(input.bucket),
      Key: input.key,
    }), { expiresIn });
  }

  async deleteObject(input: { bucket: MdateStorageBucket; key: string }): Promise<void> {
    assertKey(input.key);
    await this.client.send(new DeleteObjectCommand({
      Bucket: resolveBucket(input.bucket),
      Key: input.key,
    }));
  }
}

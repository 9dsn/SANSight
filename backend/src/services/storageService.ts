/** S3-compatible uploads for vision images (supports custom endpoint for MinIO, etc.). */
import path from "node:path";
import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env";

const s3 = new S3Client({
  region: env.AWS_REGION,
  endpoint: env.AWS_S3_ENDPOINT,
  forcePathStyle: Boolean(env.AWS_S3_ENDPOINT),
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  }
});

const buildPublicUrl = (key: string) => {
  if (env.S3_PUBLIC_BASE_URL) {
    return `${env.S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
  }

  return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
};

export const storageService = {
  async uploadVisionImage(file: Express.Multer.File, userId: string) {
    const extension = path.extname(file.originalname) || ".bin";
    const key = `vision/${userId}/${randomUUID()}${extension.toLowerCase()}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      })
    );

    return {
      key,
      url: buildPublicUrl(key)
    };
  }
};

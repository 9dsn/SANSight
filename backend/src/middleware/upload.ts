import multer from "multer";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const uploadVisionImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new HttpError(400, "Only JPEG, PNG, and WEBP images are allowed"));
      return;
    }

    callback(null, true);
  }
});

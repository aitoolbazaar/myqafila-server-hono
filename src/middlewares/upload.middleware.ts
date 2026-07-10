import { createMiddleware } from "hono/factory";
import { uploadToS3 } from "../shared/s3/upload.helper";
import type { HonoEnv } from "../types/hono.types";

export const uploadSingle = (fieldName: string, folderName = "unknown") => {
  return createMiddleware<HonoEnv>(async (c, next) => {
    const contentType = c.req.header("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const body = await c.req.parseBody();
      const file = body[fieldName];

      if (file && file instanceof File) {
        // Automatically uploads to S3 in the backgrounds
        const fileUrl = await uploadToS3(file, folderName);

        // Attaches S3 Url back to context state variables
        c.set("uploadedFileUrl", fileUrl);
      }
    }
    await next();
  });
};

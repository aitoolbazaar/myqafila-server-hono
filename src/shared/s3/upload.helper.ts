import { Upload } from "@aws-sdk/lib-storage";
import { s3Service } from "./s3.service";

export const uploadToS3 = async (
  file: File | null | undefined,
  folderName: string,
): Promise<string | null> => {
  if (!file || !(file instanceof File)) return null;

  try {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = file.name.split(".").pop();
    const key = `${folderName}/${uniqueSuffix}.${fileExtension}`;

    const upload = new Upload({
      client: s3Service.getS3(),
      params: {
        Bucket: s3Service.bucketName,
        Key: key,
        Body: file.stream(),
        ContentType: file.type,
      },
    });

    await upload.done();

    const region = await (s3Service.s3Client.config as any).region();
    return `https://${process.env.S3_BUCKET_DOMAIN}/${key}`;
  } catch (error: any) {
    throw new Error(`S3 Upload failed: ${error.message}`);
  }
};

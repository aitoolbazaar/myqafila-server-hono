import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

class S3Service {
  public s3Client: S3Client;
  public bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.bucketName = process.env.S3_BUCKET_NAME!;
  }

  getS3() {
    return this.s3Client;
  }

  async deleteFile(fileUrl: string | null | undefined) {
    if (!fileUrl) return;
    try {
      const url = new URL(fileUrl);
      const key = url.pathname.replace(/^\//, "");

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      console.log(`✅ File deleted successfully from S3: ${key}`);
    } catch (error: any) {
      console.error(`❌ S3 Delete Error: ${error.message}`);
    }
  }
}

export const s3Service = new S3Service();

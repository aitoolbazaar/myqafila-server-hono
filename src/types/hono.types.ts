// import type { AdminPayload } from "./admin.types";
// import type { UserPayload } from "./user.types";

export type HonoEnv = {
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
    AWS_REGION: string;
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    S3_BUCKET_NAME: string;
    PORT?: string;
  };
  // Variables: {
  //   admin?: AdminPayload;
  //   user?: UserPayload;
  //   uploadedFileUrl?: string | null;
  // };
};

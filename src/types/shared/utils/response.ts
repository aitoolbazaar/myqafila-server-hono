import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

// 1. Standard Success Response Format
export const sendSuccess = <T>(
  c: Context,
  message: string,
  data: T,
  statusCode: ContentfulStatusCode,
  errorCode = 0,
) => {
  return c.json(
    {
      success: true,
      errorCode,
      message,
      data,
    },
    statusCode,
  );
};

// 2. Standard Error Response Format
export const sendError = (
  c: Context,
  message: string,
  statusCode: ContentfulStatusCode,
  errorCode = 5,
  data: any = null,
) => {
  return c.json(
    {
      success: false,
      errorCode,
      message,
      data,
    },
    statusCode,
  );
};

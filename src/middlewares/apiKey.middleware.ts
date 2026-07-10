import { createMiddleware } from "hono/factory";
import { StatusCodes } from "http-status-codes";
import { sendError } from "../shared/utils/response";
import type { HonoEnv } from "../types/hono.types";

export const apiKeyMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  if (c.req.method !== "GET") {
    return await next();
  }

  const apiKey = c.req.header("x-qafila-api-key");

  if (!apiKey) {
    return sendError(
      c,
      "API key is required to access qafila public resources.",
      StatusCodes.UNAUTHORIZED,
      401,
    );
  }

  if (apiKey !== process.env.QAFILA_API_KEY) {
    return sendError(
      c,
      "Access Denied: Invalid API key.",
      StatusCodes.FORBIDDEN,
      403,
    );
  }

  await next();
});

import { zValidator as honoZValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";
import { sendError } from "./response";

export const zValidate = <T extends ZodType<any, any, any>>(
  target: keyof ValidationTargets,
  schema: T,
) => {
  return honoZValidator(target, schema, (result, c) => {
    if (!result.success) {
      // Cast 'result.error' as any to bypass TS type discrepancies
      const zodError = result.error as any;
      const fieldErrors = zodError.flatten().fieldErrors;

      // 1. Logs detailed error to the terminal console globally
      console.error(
        `❌ Validation Failed [Target: ${target}]:`,
        JSON.stringify(fieldErrors, null, 2),
      );

      // 2. Returns uniform error response format to the client
      return sendError(
        c,
        "Validation failed",
        400, // statusCode
        400, // custom errorCode
        fieldErrors, // validation errors data payload
      );
    }
  });
};

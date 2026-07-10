import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { optionalAuthMiddleware } from "../../middlewares/optionalAuth.middleware";
import { sendError } from "../../shared/utils/response";
import { StatusCodes } from "http-status-codes";
import type { HonoEnv } from "../../types/hono.types";
import { getUserDailyStatusSchema, syncGuestSchema } from "../../validation/guest.validation";
import { GuestController } from "../../controllers/guest/guest.controller";

const guestRoute = new Hono<HonoEnv>();

// Reusable hook for validation errors
const validationHook = (result: any, c: any) => {
  if (!result.success) {
    return sendError(
      c,
      result.error.errors[0]?.message || "Validation failed",
      StatusCodes.BAD_REQUEST,
    );
  }
};

guestRoute.post(
  "/sync",
  optionalAuthMiddleware,
  zValidator("json", syncGuestSchema, validationHook),
  GuestController.syncGuest,
);

guestRoute.get(
  "/daily-status",
  optionalAuthMiddleware,
  zValidator("query", getUserDailyStatusSchema, validationHook),
  GuestController.getUserDailyStatus,
);

export default guestRoute;

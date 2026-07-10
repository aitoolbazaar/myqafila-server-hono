import type { Context } from "hono";
import { StatusCodes } from "http-status-codes";
import { sendError, sendSuccess } from "../../shared/utils/response";
import type { HonoEnv } from "../../types/hono.types";
import { GuestService } from "../../services/guest/guest.service";

export class GuestController {
  static async syncGuest(c: Context<HonoEnv>) {
    try {
      const data: any = c.req.valid("json" as never);
      const guestId = data.guestId;
      const deviceInfo = data.deviceInfo;

      const userId = c.var.user?.id || null;

      // Extract client IP address
      const forwarded = c.req.header("x-forwarded-for");
      const ip = forwarded ? forwarded.split(",")[0]!.trim() : "127.0.0.1";

      const syncResult = await GuestService.syncGuestService({
        guestId,
        deviceInfo,
        userId,
        ip,
      });

      return sendSuccess(
        c,
        userId ? "User Profile Synced" : "Guest Profile Synced",
        syncResult,
        StatusCodes.OK,
      );
    } catch (error: any) {
      console.error("❌ Sync Guest Controller Error:", error);
      return sendError(
        c,
        "Failed to sync profile",
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  static async getUserDailyStatus(c: Context<HonoEnv>) {
    try {
      const data: any = c.req.valid("query" as never);
      const guestId = data.guestId;
      const userId = c.var.user?.id || null;

      const statusResult = await GuestService.getUserDailyStatusService({
        guestId,
        userId,
      });

      return c.json(
        {
          errorCode: 0,
          status: true,
          message: "User daily status retrieved successfully",
          data: statusResult,
        },
        StatusCodes.OK,
      );
    } catch (error: any) {
      console.error("❌ getUserDailyStatus Controller Error:", error);
      return c.json(
        {
          errorCode: 5,
          status: false,
          message: error.message,
          data: error,
        },
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

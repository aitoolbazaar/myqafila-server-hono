import { z } from "zod";

export const syncGuestSchema = z.object({
  guestId: z.string().min(1, "guestId is required"),
  deviceInfo: z.record(z.string(), z.any()).optional().nullable(),
});

export const getUserDailyStatusSchema = z.object({
  guestId: z.string().optional(),
});

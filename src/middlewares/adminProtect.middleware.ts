import { createMiddleware } from "hono/factory";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../config/db.config";
import { sendError } from "../shared/utils/response";
import { verify } from "hono/jwt";
import type { HonoEnv } from "../types/hono.types";

export const adminProtectMiddleware = createMiddleware<HonoEnv>(
  async (c, next) => {
    try {
      const authHeader = c.req.header("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return sendError(
          c,
          "Access Denied: No Token Provided",
          StatusCodes.UNAUTHORIZED,
          11,
        );
      }
      const token = authHeader.split(" ")[1];

      const isBlacklisted = await prisma.blacklisted_token.findUnique({
        where: { token: token },
      });
      if (isBlacklisted) {
        return sendError(
          c,
          "Session expired. Please login again.",
          StatusCodes.UNAUTHORIZED,
          14,
        );
      }

      const decoded = (await verify(
        token as string,
        process.env.JWT_SECRET!,
        "HS256",
      )) as {
        id: string;
      };

      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id },
        include: { roles: true },
      });

      if (!admin) {
        return sendError(
          c,
          "Admin not found or authorization failed",
          StatusCodes.UNAUTHORIZED,
          12,
        );
      }

      if (admin.employeeStatus !== "active") {
        return sendError(
          c,
          `Access Denied: Your account is currently ${admin.employeeStatus}`,
          StatusCodes.FORBIDDEN,
          15,
        );
      }

      c.set("admin", {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        username: admin.username,
        profilepic: admin.profilepic,
        employeeStatus: admin.employeeStatus,
        roles: admin.roles.map((r) => r.name),
      });

      await next();
    } catch (error: any) {
      console.error("❌ Admin Protect Middleware Error:", error);
      const message =
        error.name === "JwtTokenExpired"
          ? "Session expired. Please login again."
          : "Invalid or expired token";

      return sendError(c, message, StatusCodes.UNAUTHORIZED, 13);
    }
  },
);

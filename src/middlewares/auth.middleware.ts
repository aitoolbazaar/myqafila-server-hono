import { createMiddleware } from "hono/factory";
import { StatusCodes } from "http-status-codes";
import { verify } from "hono/jwt";
import { prisma } from "../config/db.config";
import { sendError } from "../shared/utils/response";
import type { HonoEnv } from "../types/hono.types";

export const authMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  try {
    // 1. Get token from Authorization header (Bearer <token>)
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

    // 2. Check if the token is in blacklist
    const isBlacklisted = await prisma.blacklisted_token.findUnique({
      where: { token: token },
    });
    if (isBlacklisted) {
      return sendError(
        c,
        "Session expired or logged out. Please login again.",
        StatusCodes.UNAUTHORIZED,
        14,
      );
    }

    // 3. Verify token (Using Hono's built-in Web-standard JWT verifier)
    const decoded = (await verify(
      token as string,
      process.env.JWT_SECRET!,
      "HS256",
    )) as {
      id: string;
    };

    // 4. Find User in DB using decoded ID
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return sendError(
        c,
        "User not found or authorization failed",
        StatusCodes.UNAUTHORIZED,
        12,
      );
    }

    // 5. Attach user details to Hono Context variables (c.set)
    c.set("user", {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      profilePic: user.profilePic,
      provider: user.provider as "GOOGLE" | "APPLE",
      linkedGuestId: user.linkedGuestId,
    });

    await next();
  } catch (error: any) {
    console.error("❌ Auth Middleware Error:", error);

    // Decides message based on JWT expiration
    const message =
      error.name === "JwtTokenExpired"
        ? "Session expired. Please login again."
        : "Invalid or expired token";

    return sendError(c, message, StatusCodes.UNAUTHORIZED, 13);
  }
});

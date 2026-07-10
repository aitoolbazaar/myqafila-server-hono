import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { prisma } from "../config/db.config";
import type { HonoEnv } from "../types/hono.types";

export const optionalAuthMiddleware = createMiddleware<HonoEnv>(
  async (c, next) => {
    try {
      const authHeader = c.req.header("authorization");

      // 1. Agar token missing hai toh user Anonymous (Guest) hai. Proceed.
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return await next();
      }

      const token = authHeader.split(" ")[1];

      // 2. Blacklisted Token check (Logout verification)
      const isBlacklisted = await prisma.blacklisted_token.findUnique({
        where: { token: token },
      });
      if (isBlacklisted) {
        return await next();
      }

      // 3. Verify JWT Token using Hono's Web standard JWT verifier
      const decoded = (await verify(
        token as string,
        process.env.JWT_SECRET!,
        "HS256",
      )) as { id: string };

      // 4. Fetch user details from Database dynamically
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (user) {
        c.set("user", {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          profilePic: user.profilePic,
          provider: user.provider as "GOOGLE" | "APPLE",
          linkedGuestId: user.linkedGuestId,
        });
      }

      await next();
    } catch (error) {
      await next();
    }
  },
);

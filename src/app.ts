import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { compress } from "hono/compress";
import { secureHeaders } from "hono/secure-headers";
import { HTTPException } from "hono/http-exception";

import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { HonoEnv } from "./types/hono.types";

// import { getStatusPage } from "./shared/utils/statusPage";
import { sendError } from "./shared/utils/response";

const app = new Hono<HonoEnv>();

// 1. Allowed CORS Origins Config
const ALLOWED_ORIGINS = [
  "https://myqafila.vercel.app",
  "https://www.myqafila.vercel.app",
  "http://localhost:3000",
  "http://localhost:5000",
];

// 2. Global Middlewares
app.use("*", logger());
app.use("*", compress());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: (origin) => (ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]),
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// 3. Health Check / Base Route
app.get("/", (c) => c.html(`<h1>API is running!</h1>`));

// 4. API Routes
import guestRoute from "./routes/guest/guest.routes";

// 4. API Routers
app.route("/api/v1/guest", guestRoute);

// 5. Global Error Handler
app.onError((err, c) => {
  console.error("🔥 Server Error:", err);

  const status = err instanceof HTTPException ? err.status : 500;
  const message = err.message || "Internal Server Error";

  return sendError(c, message, status as ContentfulStatusCode, 5);
});

// 5. Server Bootstrapping (for non-serverless Node environments)
const isProd = process.env.NODE_ENV === "production";
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";

if (isProd && !isVercel) {
  const port = Number(process.env.PORT) || 5000;
  console.log(`🚀 Qafila Core running natively on port ${port}`);
  serve({ fetch: app.fetch, port });
}

export default app;
import { Hono } from "hono";
import { serve } from '@hono/node-server'
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { compress } from "hono/compress";
import { secureHeaders } from "hono/secure-headers";
import type { HonoEnv } from "./types/hono.types";
import { sendError } from "./types/shared/utils/response";

const app = new Hono<HonoEnv>();

// Global Middlewares
app.use("*", logger());
app.use(
  "/*",
  cors({
    origin: [
      "https://gleq.ai",
      "https://www.gleq.ai",
      "http://localhost:3000",
      "http://localhost:5000",
      "https://gleq-studio.vercel.app",
      "https://www.gleq-studio.vercel.app",
    ],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("*", compress());
app.use("*", secureHeaders());

// Health Check
app.get("/", (c) => {
  return c.html("<h1>API Server is Running!</h1>");
});



// Global Error Handler
app.onError((err, c) => {
  console.error("🔥 Server Error:", err);
  // Default server error code
  let status: number = 500;
  // Agar exception Hono ke route validation ya HTTP module se hai toh status code fetch karein
  if (err instanceof HTTPException) {
    status = err.status;
  }
  return sendError(
    c,
    err.message || "Internal Server Error",
    status as ContentfulStatusCode,
    5,
  );
});

// Vercel / Node.js एनवायरनमेंट के लिए अडैप्टर एक्सपोर्ट करें
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  serve({
    fetch: app.fetch,
    port: Number(process.env.PORT) || 5000
  })
}

export default app;

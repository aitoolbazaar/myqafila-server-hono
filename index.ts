import app from "./src/app.js";
import { connectDB } from "./src/config/db.config";

// Database Connection call
connectDB();

const PORT = process.env.PORT || 5000;
console.log(`🚀 Qafila Gateway triggered on port ${PORT}`);

// Hono native fetch standard (for Bun and Vercel Edge/Serverless layers)
export const { fetch } = app;

// Standard export structure for local Bun run
export default {
  port: Number(PORT),
  fetch: app.fetch,
};
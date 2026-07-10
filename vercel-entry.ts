import { getRequestListener } from "@hono/node-server";
import app from "./src/app";
import { connectDB } from "./src/config/db.config";

// Database connect verification (Runs on function cold start)
connectDB().catch(console.error);

export default getRequestListener(app.fetch);

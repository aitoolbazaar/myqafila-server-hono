

import app from "./src/app";
import { connectDB } from "./src/config/db.config";

const PORT = process.env.PORT;
connectDB();

// 1. Connect to Database (Top-level await)

// 2. Start Server
console.log(`🚀 Server is running on port ${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
};

import express from "express";
import { initSocket } from "./lib/socket";
import { registerSocketHandlers } from "./lib/socket-loader";
import http from "http";
import cors from "cors";
import "dotenv/config"
import { connectDB } from "./lib/mongoose";

const app = express();

const port = process.env.PORT || 5000;

const server = http.createServer(app);

initSocket(server);
registerSocketHandlers();

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(
  cors({
    origin: ["http://localhost:5173"],
  })
);

(async () => {
  try {
    await connectDB();
    app.listen(port, () => console.log(`🚀 Server running on  ${port}`));
  } catch (err) {
    console.error("❌ Server startup failed:", (err as Error).message);
    process.exit(1);
  }
})();

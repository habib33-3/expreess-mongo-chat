import express from "express";
import { initSocket } from "./lib/socket";
import { registerSocketHandlers } from "./lib/socket-loader";
import http from "http";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./lib/mongoose";
import { userRouter } from "./routes/user.routes";
import { uploadRouter } from "./routes/upload.routes";
import path from "path";

const app = express();

const port = process.env.PORT || 5000;

const server = http.createServer(app);

initSocket(server);
registerSocketHandlers();

app.use("../uploads", express.static(path.join(process.cwd(), "uploads")));
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

app.use("/user", userRouter);
app.use("/upload", uploadRouter);

(async () => {
  try {
    await connectDB();
    server.listen(port, () => console.log(`🚀 Server running on  ${port}`));
  } catch (err) {
    console.error("❌ Server startup failed:", (err as Error).message);
    process.exit(1);
  }
})();

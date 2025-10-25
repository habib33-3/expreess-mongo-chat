import express from "express";
import { initSocket } from "./lib/socket";
import { registerSocketHandlers } from "./lib/socket-loader";
import http from "http";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./lib/mongoose";
import { userRouter } from "./routes/user.routes";
import path from "path";
import { uploadRouter } from "./routes/upload.routes";
import listEndpoints from "express-list-endpoints";
const app = express();

const port = process.env.PORT || 5000;

const server = http.createServer(app);

export const cors_allowed_origins = ["http://localhost:5173","https://zcr3h7z8-5173.inc1.devtunnels.ms"];

initSocket(server);
registerSocketHandlers();

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(
  cors({
    origin: cors_allowed_origins,
  })
);

app.use("/user", userRouter);
app.use("/upload", uploadRouter);

console.log(listEndpoints(app));

(async () => {
  try {
    await connectDB();
    server.listen(port, () => console.log(`🚀 Server running on  ${port}`));
  } catch (err) {
    console.error("❌ Server startup failed:", (err as Error).message);
    process.exit(1);
  }
})();

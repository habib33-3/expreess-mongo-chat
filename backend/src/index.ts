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
import { zegoRoutes } from "./routes/zego.routes";
const app = express();

const port = process.env.PORT || 5001;

const server = http.createServer(app);

// export const cors_allowed_origins = [
//   "http://localhost:5173",
//   "https://zcr3h7z8-5173.inc1.devtunnels.ms",
//   "https://zcr3h7z8-5173.inc1.devtunnels.ms"
// ];

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
    origin: "*",
  })
);

app.use("/user", userRouter);
app.use("/upload", uploadRouter);
app.use("/zego", zegoRoutes);

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

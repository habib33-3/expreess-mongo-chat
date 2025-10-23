
import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  const mongoURI = process.env.MONGO_URL;

  if (!mongoURI) {
    console.error("❌ MONGO_URL is missing from environment variables.");
    process.exit(1);
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Fail fast if Mongo is unreachable
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      family: 4,
    });

    console.log("✅ MongoDB connection established successfully.");
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", (error as Error).message);

    // Retry once after short delay — prevents failure on temporary outages
    setTimeout(async () => {
      try {
        console.log("♻️ Retrying MongoDB connection...");
        await mongoose.connect(mongoURI);
        console.log("✅ MongoDB connected on retry.");
      } catch (retryError) {
        console.error("❌ Retry failed:", (retryError as Error).message);
        process.exit(1);
      }
    }, 3000);
  }

  // Optional lifecycle listeners
  mongoose.connection.on("error", (err) => {
    console.error("⚠️ MongoDB error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected.");
  });

  process.on("SIGINT", async () => {
    try {
      await mongoose.connection.close();
      console.log("🔒 MongoDB connection closed due to app termination.");
      process.exit(0);
    } catch (closeErr) {
      console.error("⚠️ Error closing MongoDB connection:", (closeErr as Error).message);
      process.exit(1);
    }
  });
};

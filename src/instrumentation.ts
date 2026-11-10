// Open the MongoDB connection when the server starts, so the first visitor doesn't wait for it
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.MONGODB_URI) {
    const { default: connectDB } = await import("@/lib/connectDB");
    connectDB().catch((error) => console.error("MongoDB connection at startup failed:", error.message));
  }
}

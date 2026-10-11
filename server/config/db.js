const mongoose = require("mongoose");

/**
 * Connect to MongoDB instance using MONGODB_URI or MONGO_URI
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mineguard";

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[MineGuard DB] MongoDB Connected Successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error("[MineGuard DB] MongoDB Connection Error:", error.message);
    // Don't kill process immediately if offline in dev, but log warning
    return null;
  }
};

module.exports = connectDB;

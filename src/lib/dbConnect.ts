import mongoose from "mongoose";

async function dbConnect(): Promise<void> {
  if (!process.env.MONGODB_URI) {
    console.error("DbConnect | Missing MONGODB_URI");
    throw new Error("Missing MONGODB_URI");
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("DbConnect | Connected successfully");
  } catch (error) {
    console.error("DbConnect | Connection failed", error);
    throw error;
  }
}

export default dbConnect;

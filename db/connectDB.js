const mongoose = require("mongoose");

const connectDB = () => {
  if (!process.env.MONGO_URI) {
    console.error(
      "❌ MONGO_URI is not set. Add it to your environment variables (e.g. your MongoDB Atlas connection string)."
    );
    return;
  }

  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("✅ Connected to MongoDB successfully");
    })
    .catch((error) => {
      console.error("❌ Database connection error:", error.message);
    });
};

module.exports = { connectDB };

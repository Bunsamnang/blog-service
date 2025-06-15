import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import blogRoute from "./blogRoute.js";
import { extractUserFromHeader } from "./middleware/extractFromHeader.js";
dotenv.config();
const app = express();

app.use(express.json());

const PORT = 5003;

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
if (!mongoConnectionString) {
  throw new Error("MONGO_CONNECTION_STRING is not defined");
}

app.use("/", blogRoute);

mongoose.connect(mongoConnectionString).then(() => {
  console.log("Connected to mongoDB");
  app.listen(PORT, () => {
    console.log(`Blog service is running on port: ${PORT}`);
  });
});

import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user";
import bcrypt from "bcrypt";
import connectDB from "../config/db";

dotenv.config();

const seed = async () => {
  await connectDB();

  const adminEmail = process.env.ADMIN_EMAIL || "raghu.reddy@iiit.ac.in";
  const adminPass = process.env.ADMIN_PASS || "passwordbutfortheadmin";

  const exists = await User.findOne({ email: adminEmail });
  if (exists) {
    console.log("admin already exists");
    process.exit();
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(adminPass, salt);

  await User.create({
    email: adminEmail,
    password: hashed,
    role: "Admin",
  });

  console.log("admin created");
  process.exit();
};

seed();

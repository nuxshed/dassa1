import express from "express";
import { register, login, getme } from "../controllers/auth";
import { protect } from "../middleware/auth";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getme);

export default router;

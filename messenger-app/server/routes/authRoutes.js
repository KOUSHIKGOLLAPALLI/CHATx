import { Router } from "express";
import { register, verifyAccount, login, me } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/verify", verifyAccount);
router.post("/login", login);
router.get("/me", protect, me);

export default router;

import { Router } from "express";
import {
  searchUsers,
  getUser,
  blockUser,
  unblockUser
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.get("/search", searchUsers);
router.get("/:id", getUser);
router.post("/:id/block", blockUser);
router.post("/:id/unblock", unblockUser);

export default router;

import { Router } from "express";
import {
  sendRequest,
  receivedRequests,
  sentRequests,
  acceptRequest,
  rejectRequest
} from "../controllers/chatRequestController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);
router.post("/", sendRequest);
router.get("/received", receivedRequests);
router.get("/sent", sentRequests);
router.put("/:id/accept", acceptRequest);
router.put("/:id/reject", rejectRequest);

export default router;

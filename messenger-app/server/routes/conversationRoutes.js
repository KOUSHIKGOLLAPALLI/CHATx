import { Router } from "express";

import {
  getConversations,
  getMessages,
  sendMessage
} from "../controllers/conversationController.js";

import { protect } from "../middleware/authMiddleware.js";


const router = Router();


/* =====================================================
   AUTHENTICATION
===================================================== */

router.use(protect);


/* =====================================================
   GET CONVERSATIONS
===================================================== */

router.get(
  "/",
  getConversations
);


/* =====================================================
   GET MESSAGES
===================================================== */

router.get(
  "/:id/messages",
  getMessages
);


/* =====================================================
   SEND MESSAGE
===================================================== */

router.post(
  "/:id/messages",
  sendMessage
);


export default router;
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { hasAcceptedChat } from "./chatRequestController.js";

export async function sendMessage(req, res) {
  const { conversationId, content } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ message: "Message cannot be empty" });
  }

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: req.user._id
  });

  if (!conversation) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  const receiver = conversation.participants.find(
    id => id.toString() !== req.user._id.toString()
  );

  if (!receiver) {
    return res.status(400).json({ message: "Invalid conversation" });
  }

  const targetUser = await User.findById(receiver).select("blockedUsers");

  if (
    targetUser?.blockedUsers?.some(id => id.toString() === req.user._id.toString()) ||
    req.user.blockedUsers?.some(id => id.toString() === receiver.toString())
  ) {
    return res.status(403).json({ message: "You cannot message this user" });
  }

  if (!(await hasAcceptedChat(req.user._id, receiver))) {
    return res.status(403).json({ message: "Chat has not been accepted" });
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    receiver,
    content: content.trim()
  });

  conversation.lastMessage = message._id;
  await conversation.save();

  const populated = await Message.findById(message._id)
    .populate("sender", "username profilePicture");

  res.status(201).json({ message: populated });
}

import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { hasAcceptedChat } from "../controllers/chatRequestController.js";
import {
  addOnlineUser,
  removeOnlineUser,
  getSocketId,
  getOnlineUserIds
} from "./onlineUsers.js";

export function registerSocketHandlers(io) {
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Invalid socket token"));
    }
  });

  io.on("connection", async socket => {
    const userId = socket.userId;

    addOnlineUser(userId, socket.id);

    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: new Date()
    });

    io.emit("presence:update", {
      userId,
      isOnline: true,
      lastSeen: new Date()
    });

    socket.emit("presence:list", getOnlineUserIds());

    socket.on("join_conversation", async conversationId => {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId
      });

      if (conversation) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit("typing", {
        userId,
        conversationId,
        isTyping
      });
    });

    socket.on("send_message", async ({ conversationId, content }, callback) => {
      try {
        if (!content?.trim()) {
          return callback?.({ ok: false, message: "Message is empty" });
        }

        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });

        if (!conversation) {
          return callback?.({ ok: false, message: "Conversation not found" });
        }

        const receiver = conversation.participants.find(
          id => id.toString() !== userId.toString()
        );

        if (!(await hasAcceptedChat(userId, receiver))) {
          return callback?.({ ok: false, message: "Chat is not accepted" });
        }

        const [senderUser, receiverUser] = await Promise.all([
          User.findById(userId).select("blockedUsers"),
          User.findById(receiver).select("blockedUsers")
        ]);

        const blocked =
          senderUser.blockedUsers.some(id => id.toString() === receiver.toString()) ||
          receiverUser.blockedUsers.some(id => id.toString() === userId.toString());

        if (blocked) {
          return callback?.({ ok: false, message: "Messaging is blocked" });
        }

        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          receiver,
          content: content.trim()
        });

        conversation.lastMessage = message._id;
        await conversation.save();

        const populated = await Message.findById(message._id)
          .populate("sender", "username profilePicture");

        io.to(`conversation:${conversationId}`).emit("new_message", populated);

        const receiverSocket = getSocketId(receiver);
        if (receiverSocket) {
          io.to(receiverSocket).emit("conversation_updated", {
            conversationId,
            message: populated
          });
        }

        callback?.({ ok: true, message: populated });
      } catch (error) {
        console.error("Socket message error:", error);
        callback?.({ ok: false, message: "Failed to send message" });
      }
    });

    socket.on("mark_read", async ({ conversationId }) => {
      await Message.updateMany(
        {
          conversation: conversationId,
          receiver: userId,
          isRead: false
        },
        { $set: { isRead: true } }
      );

      io.to(`conversation:${conversationId}`).emit("messages_read", {
        conversationId,
        userId
      });
    });

    socket.on("disconnect", async () => {
      removeOnlineUser(userId);

      const lastSeen = new Date();

      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen
      });

      io.emit("presence:update", {
        userId,
        isOnline: false,
        lastSeen
      });
    });
  });
}

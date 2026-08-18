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

  /* =====================================================
     SOCKET AUTHENTICATION
  ===================================================== */

  io.use((socket, next) => {

    try {

      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization
          ?.replace("Bearer ", "");

      if (!token) {
        return next(
          new Error("Authentication required")
        );
      }

      const decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );

      socket.userId =
        decoded.userId;

      next();

    } catch (error) {

      console.error(
        "Socket authentication error:",
        error
      );

      next(
        new Error("Invalid socket token")
      );

    }

  });


  /* =====================================================
     CONNECTION
  ===================================================== */

  io.on("connection", async (socket) => {

    const userId =
      socket.userId;

    console.log(
      "Socket connected:",
      userId,
      socket.id
    );


    /* =================================================
       ADD USER TO ONLINE USERS
    ================================================= */

    addOnlineUser(
      userId,
      socket.id
    );


    /* =================================================
       UPDATE USER ONLINE STATUS
    ================================================= */

    try {

      await User.findByIdAndUpdate(
        userId,
        {
          isOnline: true
        }
      );

    } catch (error) {

      console.error(
        "Failed to update online status:",
        error
      );

    }


    /* =================================================
       TELL ALL CLIENTS USER IS ONLINE
    ================================================= */

    io.emit(
      "presence:update",
      {
        userId,
        isOnline: true
      }
    );


    /* =================================================
       SEND CURRENT ONLINE USERS
    ================================================= */

    socket.emit(
      "presence:list",
      getOnlineUserIds()
    );


    /* =================================================
       JOIN CONVERSATION
    ================================================= */

    socket.on(
      "join_conversation",
      async (conversationId) => {

        try {

          const conversation =
            await Conversation.findOne({
              _id: conversationId,
              participants: userId
            });

          if (conversation) {

            socket.join(
              `conversation:${conversationId}`
            );

          }

        } catch (error) {

          console.error(
            "Join conversation error:",
            error
          );

        }

      }
    );


    /* =================================================
       TYPING
    ================================================= */

    socket.on(
      "typing",
      ({ conversationId, isTyping }) => {

        socket
          .to(`conversation:${conversationId}`)
          .emit(
            "typing",
            {
              userId,
              conversationId,
              isTyping
            }
          );

      }
    );


    /* =================================================
       SEND MESSAGE
    ================================================= */

    socket.on(
      "send_message",
      async (
        { conversationId, content },
        callback
      ) => {

        try {

          if (!content?.trim()) {

            return callback?.({
              ok: false,
              message: "Message is empty"
            });

          }


          const conversation =
            await Conversation.findOne({
              _id: conversationId,
              participants: userId
            });


          if (!conversation) {

            return callback?.({
              ok: false,
              message: "Conversation not found"
            });

          }


          const receiver =
            conversation.participants.find(
              id =>
                id.toString() !==
                userId.toString()
            );


          if (
            !(await hasAcceptedChat(
              userId,
              receiver
            ))
          ) {

            return callback?.({
              ok: false,
              message: "Chat is not accepted"
            });

          }


          const [
            senderUser,
            receiverUser
          ] = await Promise.all([

            User.findById(userId)
              .select("blockedUsers"),

            User.findById(receiver)
              .select("blockedUsers")

          ]);


          const blocked =
            senderUser.blockedUsers.some(
              id =>
                id.toString() ===
                receiver.toString()
            ) ||
            receiverUser.blockedUsers.some(
              id =>
                id.toString() ===
                userId.toString()
            );


          if (blocked) {

            return callback?.({
              ok: false,
              message: "Messaging is blocked"
            });

          }


          const message =
            await Message.create({

              conversation:
                conversationId,

              sender:
                userId,

              receiver,

              content:
                content.trim()

            });


          conversation.lastMessage =
            message._id;

          await conversation.save();


          const populated =
            await Message.findById(
              message._id
            )
              .populate(
                "sender",
                "username profilePicture"
              );


          /* =============================================
             SEND MESSAGE TO CONVERSATION
          ============================================= */

          io
            .to(`conversation:${conversationId}`)
            .emit(
              "new_message",
              populated
            );


          /* =============================================
             UPDATE RECEIVER CONVERSATION
          ============================================= */

          const receiverSocket =
            getSocketId(receiver);


          if (receiverSocket) {

            io
              .to(receiverSocket)
              .emit(
                "conversation_updated",
                {
                  conversationId,
                  message: populated
                }
              );

          }


          callback?.({
            ok: true,
            message: populated
          });


        } catch (error) {

          console.error(
            "Socket message error:",
            error
          );

          callback?.({
            ok: false,
            message:
              "Failed to send message"
          });

        }

      }
    );


    /* =====================================================
       MARK READ
    ===================================================== */

    socket.on(
      "mark_read",
      async ({ conversationId }) => {

        try {

          await Message.updateMany(
            {
              conversation:
                conversationId,

              receiver:
                userId,

              isRead:
                false
            },

            {
              $set: {
                isRead: true
              }
            }
          );


          io
            .to(
              `conversation:${conversationId}`
            )
            .emit(
              "messages_read",
              {
                conversationId,
                userId
              }
            );

        } catch (error) {

          console.error(
            "Mark read error:",
            error
          );

        }

      }
    );


    /* =====================================================
       DISCONNECT
    ===================================================== */

    socket.on(
      "disconnect",
      async (reason) => {

        console.log(
          "Socket disconnected:",
          userId,
          socket.id,
          reason
        );


        /* ===============================================
           REMOVE SOCKET
        =============================================== */

        removeOnlineUser(
          userId
        );


        /* ===============================================
           LAST SEEN
        =============================================== */

        const lastSeen =
          new Date();


        try {

          await User.findByIdAndUpdate(
            userId,
            {
              isOnline: false,
              lastSeen
            }
          );


          /* =============================================
             TELL ALL CLIENTS USER IS OFFLINE
          ============================================= */

          io.emit(
            "presence:update",
            {
              userId,
              isOnline: false,
              lastSeen
            }
          );

        } catch (error) {

          console.error(
            "Failed to update offline status:",
            error
          );

        }

      }
    );

  });

}

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";


/* =====================================================
   GET CONVERSATIONS
===================================================== */

export async function getConversations(req, res) {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate(
        "participants",
        "username email profilePicture isOnline lastSeen"
      )
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json({
      conversations
    });

  } catch (error) {
    console.error(
      "Get conversations error:",
      error
    );

    res.status(500).json({
      message: "Failed to load conversations"
    });
  }
}


/* =====================================================
   GET MESSAGES
===================================================== */

export async function getMessages(req, res) {
  try {

    const conversation =
      await Conversation.findOne({
        _id: req.params.id,
        participants: req.user._id
      });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found"
      });
    }

    const messages =
      await Message.find({
        conversation: conversation._id
      })
        .populate(
          "sender",
          "username profilePicture"
        )
        .populate(
          "receiver",
          "username profilePicture"
        )
        .sort({
          createdAt: 1
        })
        .limit(500);

    await Message.updateMany(
      {
        conversation: conversation._id,
        receiver: req.user._id,
        isRead: false
      },
      {
        $set: {
          isRead: true
        }
      }
    );

    res.json({
      messages
    });

  } catch (error) {

    console.error(
      "Get messages error:",
      error
    );

    res.status(500).json({
      message: "Failed to load messages"
    });
  }
}


/* =====================================================
   SEND MESSAGE
===================================================== */

export async function sendMessage(req, res) {

  try {

    const {
      content
    } = req.body;


    /* -----------------------------------------------
       VALIDATE MESSAGE
    ------------------------------------------------ */

    if (
      !content ||
      !content.trim()
    ) {

      return res.status(400).json({
        message: "Message content is required"
      });

    }


    /* -----------------------------------------------
       FIND CONVERSATION
    ------------------------------------------------ */

    const conversation =
      await Conversation.findOne({
        _id: req.params.id,
        participants: req.user._id
      });


    if (!conversation) {

      return res.status(404).json({
        message: "Conversation not found"
      });

    }


    /* -----------------------------------------------
       FIND RECEIVER
    ------------------------------------------------ */

    const receiver =
      conversation.participants.find(
        participant =>
          String(participant) !==
          String(req.user._id)
      );


    if (!receiver) {

      return res.status(400).json({
        message: "Receiver not found"
      });

    }


    /* -----------------------------------------------
       CREATE MESSAGE
    ------------------------------------------------ */

    const message =
      await Message.create({

        conversation:
          conversation._id,

        sender:
          req.user._id,

        receiver:
          receiver,

        content:
          content.trim(),

        isRead:
          false

      });


    /* -----------------------------------------------
       UPDATE LAST MESSAGE
    ------------------------------------------------ */

    conversation.lastMessage =
      message._id;

    await conversation.save();


    /* -----------------------------------------------
       GET FULL MESSAGE
    ------------------------------------------------ */

    const populatedMessage =
      await Message.findById(
        message._id
      )
        .populate(
          "sender",
          "username profilePicture"
        )
        .populate(
          "receiver",
          "username profilePicture"
        );


    /* -----------------------------------------------
       RETURN MESSAGE
    ------------------------------------------------ */

    return res.status(201).json({

      message:
        populatedMessage

    });

  } catch (error) {

    console.error(
      "SEND MESSAGE ERROR:",
      error
    );

    return res.status(500).json({

      message:
        "Failed to send message",

      error:
        error.message

    });

  }
}
import User from "../models/User.js";
import ChatRequest from "../models/ChatRequest.js";
import Conversation from "../models/Conversation.js";

async function isBlocked(userA, userB) {
  const [a, b] = await Promise.all([
    User.findById(userA).select("blockedUsers"),
    User.findById(userB).select("blockedUsers")
  ]);

  return (
    a?.blockedUsers?.some(id => id.toString() === userB.toString()) ||
    b?.blockedUsers?.some(id => id.toString() === userA.toString())
  );
}

export async function sendRequest(req, res) {
  const receiverId = req.body.receiverId;

  if (!receiverId || receiverId === req.user._id.toString()) {
    return res.status(400).json({ message: "Invalid receiver" });
  }

  const receiver = await User.findById(receiverId);

  if (!receiver || !receiver.isVerified) {
    return res.status(404).json({ message: "Verified user not found" });
  }

  if (await isBlocked(req.user._id, receiverId)) {
    return res.status(403).json({ message: "Chat request is not allowed" });
  }

  const existing = await ChatRequest.findOne({
    sender: req.user._id,
    receiver: receiverId
  });

  if (existing) {
    return res.status(409).json({ message: `Request already ${existing.status}` });
  }

  const reverse = await ChatRequest.findOne({
    sender: receiverId,
    receiver: req.user._id
  });

  if (reverse?.status === "accepted") {
    return res.status(409).json({ message: "You already have a conversation" });
  }

  const request = await ChatRequest.create({
    sender: req.user._id,
    receiver: receiverId
  });

  res.status(201).json({ request });
}

export async function receivedRequests(req, res) {
  const requests = await ChatRequest.find({
    receiver: req.user._id,
    status: "pending"
  })
    .populate("sender", "username email profilePicture isOnline lastSeen")
    .sort({ createdAt: -1 });

  res.json({ requests });
}

export async function sentRequests(req, res) {
  const requests = await ChatRequest.find({
    sender: req.user._id
  })
    .populate("receiver", "username email profilePicture isOnline lastSeen")
    .sort({ createdAt: -1 });

  res.json({ requests });
}

export async function acceptRequest(req, res) {
  const request = await ChatRequest.findOne({
    _id: req.params.id,
    receiver: req.user._id,
    status: "pending"
  });

  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  request.status = "accepted";
  await request.save();

  let conversation = await Conversation.findOne({
    participants: { $all: [request.sender, request.receiver] },
    $expr: { $eq: [{ $size: "$participants" }, 2] }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [request.sender, request.receiver]
    });
  }

  res.json({ message: "Request accepted", conversation });
}

export async function rejectRequest(req, res) {
  const request = await ChatRequest.findOne({
    _id: req.params.id,
    receiver: req.user._id,
    status: "pending"
  });

  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  request.status = "rejected";
  await request.save();

  res.json({ message: "Request rejected" });
}

export async function hasAcceptedChat(userA, userB) {
  const request = await ChatRequest.findOne({
    $or: [
      { sender: userA, receiver: userB },
      { sender: userB, receiver: userA }
    ],
    status: "accepted"
  });

  return Boolean(request);
}

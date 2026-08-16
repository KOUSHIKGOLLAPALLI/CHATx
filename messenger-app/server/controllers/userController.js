import User from "../models/User.js";

export async function searchUsers(req, res) {
  const q = (req.query.q || "").trim();

  if (q.length < 2) {
    return res.json({ users: [] });
  }

  const users = await User.find({
    _id: { $ne: req.user._id },
    isVerified: true,
    $or: [
      { username: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } }
    ]
  })
    .select("username email profilePicture isOnline lastSeen")
    .limit(20);

  res.json({ users });
}

export async function getUser(req, res) {
  const user = await User.findById(req.params.id).select(
    "username email profilePicture isOnline lastSeen"
  );

  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({ user });
}

export async function blockUser(req, res) {
  const userId = req.params.id;

  if (userId === req.user._id.toString()) {
    return res.status(400).json({ message: "You cannot block yourself" });
  }

  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { blockedUsers: userId }
  });

  res.json({ message: "User blocked" });
}

export async function unblockUser(req, res) {
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { blockedUsers: req.params.id }
  });

  res.json({ message: "User unblocked" });
}

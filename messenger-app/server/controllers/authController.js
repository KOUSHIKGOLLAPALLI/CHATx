import User from "../models/User.js";
import { hashPassword, comparePassword } from "../utils/passwordUtils.js";
import { generateToken } from "../utils/generateToken.js";
import { generateVerificationCode } from "../utils/verificationCode.js";

function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    profilePicture: user.profilePicture,
    isVerified: user.isVerified,
    isOnline: user.isOnline,
    lastSeen: user.lastSeen
  };
}

export async function register(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Username, email and password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const exists = await User.findOne({
    $or: [{ email: normalizedEmail }, { username: username.trim() }]
  });

  if (exists) {
    return res.status(409).json({ message: "Username or email already exists" });
  }

  const verificationCode = generateVerificationCode();
  const passwordHash = await hashPassword(password);

  const user = await User.create({
    username: username.trim(),
    email: normalizedEmail,
    password: passwordHash,
    verificationCode,
    verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000)
  });

  // Development only: replace this with an email provider in production.
  console.log(`Verification code for ${user.email}: ${verificationCode}`);

  res.status(201).json({
    message: "Registration successful. Check the server terminal for the verification code.",
    userId: user._id
  });
}

export async function verifyAccount(req, res) {
  const { email, code } = req.body;

  const user = await User.findOne({ email: email?.trim().toLowerCase() })
    .select("+verificationCode +verificationCodeExpires");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.isVerified) {
    return res.json({ message: "Account is already verified" });
  }

  if (
    !user.verificationCode ||
    user.verificationCode !== code ||
    !user.verificationCodeExpires ||
    user.verificationCodeExpires < new Date()
  ) {
    return res.status(400).json({ message: "Invalid or expired verification code" });
  }

  user.isVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  await user.save();

  res.json({ message: "Account verified successfully" });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email?.trim().toLowerCase() }).select("+password");

  if (!user || !(await comparePassword(password || "", user.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  if (!user.isVerified) {
    return res.status(403).json({ message: "Please verify your account first" });
  }

  const token = generateToken(user._id.toString());

  res.json({
    token,
    user: publicUser(user)
  });
}

export async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

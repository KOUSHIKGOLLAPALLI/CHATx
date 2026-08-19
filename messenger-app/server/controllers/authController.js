import User from "../models/User.js";
import { hashPassword, comparePassword } from "../utils/passwordUtils.js";
import { generateToken } from "../utils/generateToken.js";
import { generateVerificationCode } from "../utils/verificationCode.js";
import { sendEmail } from "../utils/email.js";

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

// ===============================
// REGISTER
// ===============================

export async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    // Check if username or email already exists
    const exists = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: normalizedUsername }
      ]
    });

    if (exists) {
      return res.status(409).json({
        message: "Username or email already exists"
      });
    }

    // Generate 6-digit verification code
    const verificationCode = generateVerificationCode();

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: passwordHash,
      verificationCode,
      verificationCodeExpires: new Date(
        Date.now() + 10 * 60 * 1000
      )
    });

    // Send OTP to user's email
    await sendEmail(
      user.email,
      "ChatX - Email Verification",
      `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 30px;
          border: 1px solid #ddd;
          border-radius: 10px;
        ">

          <h2 style="text-align: center;">
            Welcome to ChatX
          </h2>

          <p>Hello <strong>${user.username}</strong>,</p>

          <p>
            Thank you for registering with ChatX.
            Please use the verification code below
            to verify your email address.
          </p>

          <div style="
            text-align: center;
            margin: 30px 0;
          ">
            <span style="
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
            ">
              ${verificationCode}
            </span>
          </div>

          <p>
            This verification code will expire in
            <strong>10 minutes</strong>.
          </p>

          <p>
            If you did not create a ChatX account,
            you can safely ignore this email.
          </p>

          <p>
            Thanks,<br>
            <strong>ChatX Team</strong>
          </p>

        </div>
      `
    );

    return res.status(201).json({
      message: "Registration successful. Verification code sent to your email.",
      userId: user._id,
      email: user.email
    });

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Registration failed. Please try again."
    });
  }
}


// ===============================
// VERIFY ACCOUNT
// ===============================

export async function verifyAccount(req, res) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: "Email and verification code are required"
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select(
      "+verificationCode +verificationCodeExpires"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user.isVerified) {
      return res.json({
        message: "Account is already verified"
      });
    }

    // Check verification code
    if (
      !user.verificationCode ||
      user.verificationCode !== code.toString() ||
      !user.verificationCodeExpires ||
      user.verificationCodeExpires < new Date()
    ) {
      return res.status(400).json({
        message: "Invalid or expired verification code"
      });
    }

    // Verify account
    user.isVerified = true;

    // Remove OTP after successful verification
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;

    await user.save();

    return res.json({
      message: "Account verified successfully"
    });

  } catch (error) {
    console.error("Verification error:", error);

    return res.status(500).json({
      message: "Account verification failed"
    });
  }
}


// ===============================
// LOGIN
// ===============================

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select("+password");

    if (
      !user ||
      !(await comparePassword(password, user.password))
    ) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Don't allow unverified users to login
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your account first"
      });
    }

    // Generate JWT
    const token = generateToken(
      user._id.toString()
    );

    return res.json({
      token,
      user: publicUser(user)
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed"
    });
  }
}


// ===============================
// CURRENT USER
// ===============================

export async function me(req, res) {
  return res.json({
    user: publicUser(req.user)
  });
}

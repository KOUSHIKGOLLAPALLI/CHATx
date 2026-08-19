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

// ========================================
// REGISTER
// ========================================

export async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    // Validate fields
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

    // ========================================
    // CHECK EMAIL
    // ========================================

    const emailExists = await User.findOne({
      email: normalizedEmail
    });

    if (emailExists) {
      return res.status(409).json({
        message: "Email already exists"
      });
    }

    // ========================================
    // CHECK USERNAME
    // ========================================

    const usernameExists = await User.findOne({
      username: normalizedUsername
    });

    if (usernameExists) {
      return res.status(409).json({
        message: "Username already exists"
      });
    }

    // ========================================
    // GENERATE OTP
    // ========================================

    const verificationCode = generateVerificationCode();

    // OTP expires after 10 minutes
    const verificationCodeExpires = new Date(
      Date.now() + 10 * 60 * 1000
    );

    // ========================================
    // HASH PASSWORD
    // ========================================

    const passwordHash = await hashPassword(password);

    // ========================================
    // CREATE USER
    // ========================================

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: passwordHash,

      isVerified: false,

      verificationCode,
      verificationCodeExpires
    });

    // ========================================
    // SEND OTP EMAIL
    // ========================================

    try {
      await sendEmail(
        user.email,
        "ChatX - Email Verification",
        `
          <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 30px;
            border: 1px solid #ddd;
            border-radius: 10px;
            background-color: #ffffff;
          ">

            <h2 style="
              text-align: center;
              color: #333;
            ">
              Welcome to ChatX
            </h2>

            <p>
              Hello <strong>${user.username}</strong>,
            </p>

            <p>
              Thank you for creating your ChatX account.
              Please use the verification code below
              to verify your email address.
            </p>

            <div style="
              text-align: center;
              margin: 30px 0;
            ">
              <span style="
                display: inline-block;
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 8px;
                padding: 15px 25px;
                background-color: #f2f2f2;
                border-radius: 8px;
              ">
                ${verificationCode}
              </span>
            </div>

            <p>
              This verification code will expire in
              <strong>10 minutes</strong>.
            </p>

            <p>
              Do not share this code with anyone.
            </p>

            <p>
              If you did not create this account,
              you can safely ignore this email.
            </p>

            <br>

            <p>
              Thanks,<br>
              <strong>ChatX Team</strong>
            </p>

          </div>
        `
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);

      // Remove the user if email could not be sent
      await User.findByIdAndDelete(user._id);

      return res.status(500).json({
        message: "Unable to send verification email. Please try again."
      });
    }

    // ========================================
    // SUCCESS RESPONSE
    // ========================================

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


// ========================================
// VERIFY ACCOUNT
// ========================================

export async function verifyAccount(req, res) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        message: "Email and verification code are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    }).select(
      "+verificationCode +verificationCodeExpires"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        message: "Account is already verified"
      });
    }

    // Check whether OTP exists
    if (!user.verificationCode) {
      return res.status(400).json({
        message: "No verification code found. Please request a new code."
      });
    }

    // Check OTP
    if (user.verificationCode !== code.toString().trim()) {
      return res.status(400).json({
        message: "Invalid verification code"
      });
    }

    // Check OTP expiry
    if (
      !user.verificationCodeExpires ||
      user.verificationCodeExpires < new Date()
    ) {
      return res.status(400).json({
        message: "Verification code has expired"
      });
    }

    // ========================================
    // VERIFY USER
    // ========================================

    user.isVerified = true;

    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;

    await user.save();

    return res.status(200).json({
      message: "Account verified successfully. You can now login."
    });

  } catch (error) {
    console.error("Verification error:", error);

    return res.status(500).json({
      message: "Account verification failed."
    });
  }
}


// ========================================
// LOGIN
// ========================================

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    }).select("+password");

    // Check user and password
    if (
      !user ||
      !(await comparePassword(password, user.password))
    ) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // ========================================
    // CHECK EMAIL VERIFICATION
    // ========================================

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your account before logging in.",
        isVerified: false
      });
    }

    // ========================================
    // GENERATE JWT
    // ========================================

    const token = generateToken(
      user._id.toString()
    );

    return res.status(200).json({
      token,
      user: publicUser(user)
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed."
    });
  }
}


// ========================================
// CURRENT USER
// ========================================

export async function me(req, res) {
  return res.json({
    user: publicUser(req.user)
  });
}

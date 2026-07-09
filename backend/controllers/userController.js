import jwt from "jsonwebtoken";
import User from "../models/User.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

const sendCookieToken = (res, refreshToken) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Signup user
export const signupUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const userCount = await User.countDocuments({});
    const isAdmin = userCount === 0;

    const user = new User({
      name,
      email,
      password,
      isAdmin,
      verificationToken,
      verificationTokenExpires,
    });

    const hasSMTPConfig =
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      !process.env.SMTP_HOST.includes("yourprovider") &&
      !process.env.SMTP_USER.includes("your-smtp-user") &&
      !process.env.SMTP_PASS.includes("your-smtp-password");

    if (!hasSMTPConfig) {
      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
    }

    await user.save();

    if (!hasSMTPConfig) {
      return res.status(201).json({
        message: "Registration successful! You can log in right away in local mode.",
      });
    }

    const verificationLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 8px;">
        <h2 style="color: #1B2A4A; text-align: center;">Verify Your Account</h2>
        <p>Dear ${name},</p>
        <p>Thank you for registering at Dominion Clothing. Please verify your account by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #1B2A4A; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Verify Email</a>
        </div>
        <p>This verification link will expire in 24 hours.</p>
        <p>If you did not create this account, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #888; text-align: center;">Dominion Clothing - Walk in Power. Dress in Purpose.</p>
      </div>
    `;

    try {
      await sendEmail({
        to: email,
        subject: "Dominion Clothing - Verify Your Account",
        html: emailHtml,
      });
      return res.status(201).json({ message: "Registration successful! Please verify your email to log in." });
    } catch (mailErr) {
      console.error("Mail send error during signup:", mailErr);
      user.isVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
      await user.save();
      return res.status(201).json({
        message: "Registration successful! You can log in right away because email verification is unavailable in this setup.",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const matches = await user.matchPassword(password);
    if (!matches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: "Please verify your email before logging in" });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    sendCookieToken(res, refreshToken);

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      phone: user.phone || "",
      token: accessToken,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Verify Email
export const verifyEmail = async (req, res) => {
  const { token } = req.body;
  try {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return res.json({ message: "Email verified successfully! You can now log in." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Refresh token rotation
export const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return res.status(401).json({ message: "No refresh token, access denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || "refresh_secret_key_888");
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found for token" });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    sendCookieToken(res, newRefreshToken);

    return res.json({ token: newAccessToken });
  } catch (error) {
    console.error("Refresh token error: ", error);
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

// Logout
export const logoutUser = async (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.json({ message: "Logged out successfully" });
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "If an account exists with that email, a password reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    const resetLink = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 8px;">
        <h2 style="color: #1B2A4A; text-align: center;">Reset Your Password</h2>
        <p>Dear ${user.name},</p>
        <p>You requested a password reset. Please click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #1B2A4A; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>This password reset link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #888; text-align: center;">Dominion Clothing - Walk in Power. Dress in Purpose.</p>
      </div>
    `;

    try {
      await sendEmail({
        to: email,
        subject: "Dominion Clothing - Reset Password",
        html: emailHtml,
      });
    } catch (mailErr) {
      console.error("Mail send error during forgotPassword:", mailErr);
    }

    return res.json({ message: "If an account exists with that email, a password reset link has been sent." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset password token" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: "Password reset successful! You can now log in." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get profile details
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -verificationToken -verificationTokenExpires -resetPasswordToken -resetPasswordExpires"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Update profile details
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = req.body.name || user.name;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;

    await user.save();
    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Address endpoints
export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return res.json(user.addresses || []);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const addAddress = async (req, res) => {
  const { street, city, state, postalCode, country, phone, isDefault } = req.body;
  try {
    const user = await User.findById(req.user._id);

    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const isFirst = user.addresses.length === 0;

    user.addresses.push({
      street,
      city,
      state,
      postalCode,
      country: country || "India",
      phone,
      isDefault: isDefault !== undefined ? isDefault : isFirst,
    });

    await user.save();
    return res.status(201).json(user.addresses);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateAddress = async (req, res) => {
  const { addressId } = req.params;
  const { street, city, state, postalCode, country, phone, isDefault } = req.body;
  try {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(addressId);
    if (!addr) {
      return res.status(404).json({ message: "Address not found" });
    }

    if (isDefault) {
      user.addresses.forEach((item) => {
        item.isDefault = false;
      });
      addr.isDefault = true;
    } else {
      addr.isDefault = isDefault !== undefined ? isDefault : addr.isDefault;
    }

    addr.street = street || addr.street;
    addr.city = city || addr.city;
    addr.state = state || addr.state;
    addr.postalCode = postalCode || addr.postalCode;
    addr.country = country || addr.country;
    addr.phone = phone || addr.phone;

    await user.save();
    return res.json(user.addresses);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteAddress = async (req, res) => {
  const { addressId } = req.params;
  try {
    const user = await User.findById(req.user._id);
    user.addresses.pull(addressId);

    // If we deleted the default address, promote another default if available
    const hasDefault = user.addresses.some((a) => a.isDefault);
    if (!hasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    return res.json(user.addresses);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Wishlist endpoints
export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");
    return res.json(user.wishlist || []);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const toggleWishlist = async (req, res) => {
  const { productId } = req.body;
  try {
    const user = await User.findById(req.user._id);
    const isWished = user.wishlist.includes(productId);

    if (isWished) {
      user.wishlist.pull(productId);
    } else {
      user.wishlist.push(productId);
    }

    await user.save();
    const updatedUser = await User.findById(req.user._id).populate("wishlist");
    return res.json(updatedUser.wishlist);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Cart endpoints
export const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("cart.product");
    return res.json(user.cart || []);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const syncCart = async (req, res) => {
  const { cartItems } = req.body; // array of { product: id, size, color, qty }
  try {
    const user = await User.findById(req.user._id);
    user.cart = cartItems.map((c) => ({
      product: c.product,
      size: c.size,
      color: c.color || "",
      qty: c.qty,
    }));
    await user.save();
    const updatedUser = await User.findById(req.user._id).populate("cart.product");
    return res.json(updatedUser.cart);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

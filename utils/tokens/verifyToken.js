import jwt from "jsonwebtoken";
import UserRefreshToken from "../../models/UserRefreshToken.js";
import { ServerConfig } from "../../config/server.config.js";


// Verify Access Token
const verifyToken = (token) => {
  try {
    const privateKey = process.env.JWT_ACCESS_TOKEN_SECRET_KEY;
    return jwt.verify(token, privateKey);
  } catch (error) {
    console.error("❌ Error verifying access token:", error.message);
    throw new Error("Invalid access token");
  }
};

const verifyResetToken = (token) => {
  try {
    const privateKey = ServerConfig.JWT_EMAIL_RESET_SECRET;
    return jwt.verify(token, privateKey);
  } catch (error) {
    throw { error: true, message: "Invalid reset token" };
  }
};

// Verify Refresh Token
const verifyRefreshToken = async (refreshToken) => {
  try {
    const privateKey = process.env.JWT_REFRESH_TOKEN_SECRET_KEY;

    // Find the refresh token document
    const userRefreshToken = await UserRefreshToken.findOne({ token: refreshToken });
    console.log("🔍 Looking up refresh token in DB:", refreshToken);
    console.log("🔍 User Refresh Token Document:", userRefreshToken);

    // If refresh token not found, reject with an error
    if (!userRefreshToken) {
      console.log("❌ Refresh token not found in DB");
      throw { error: true, message: "Invalid refresh token" };
    }

    // Check if token is blacklisted
    if (userRefreshToken.blacklisted) {
      console.log("❌ Refresh token is blacklisted");
      throw { error: true, message: "Refresh token is blacklisted" };
    }

    // Verify the refresh token
    const tokenDetails = jwt.verify(refreshToken, privateKey);
    console.log("✅ Refresh token verified successfully:", tokenDetails);

    // If verification successful, resolve with token details
    return {
      tokenDetails,
      error: false,
      message: "Valid refresh token",
    };
  } catch (error) {
    console.log("❌ Error verifying refresh token:", error.message || error);
    throw { error: true, message: error.message || "Invalid refresh token" };
  }
};

export { verifyRefreshToken, verifyResetToken , verifyToken };

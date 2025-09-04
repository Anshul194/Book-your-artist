import WalletService from "../service/walletService.js";
import User from '../models/user.js';

const walletService = new WalletService();

export const getUserWalletHistory = async (req, res) => {
  try {
    const data = await walletService.findByUserId(req.user._id);
    res.status(200).json({
      success: true,
      message: "Wallet history fetched successfully",
      data,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAdminWalletHistory = async (req, res) => {
  try {
    const data = await walletService.findAll();
    res.status(200).json({
      success: true,
      message: "All wallet history fetched successfully",
      data,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAdminWalletHistoryByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const data = await walletService.getWalletHistoryByUserId(userId);

    res.status(200).json({
      success: true,
      message: "Wallet history fetched successfully for the user",
      data,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ from token
    console.log("🔍 Getting wallet balance for user:", userId);
    

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
        data: {},
        err: "Missing user ID",
      });
    }

    const user = await User.findById(userId).select("balance");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: {},
        err: "Invalid user ID",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Wallet balance fetched successfully",
      data: { balance: user.balance || 0 },
      err: {},
    });
  } catch (err) {
    console.error("❌ Error getting wallet balance:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wallet balance",
      data: {},
      err: err.message,
    });
  }
};

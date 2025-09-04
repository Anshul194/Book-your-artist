import WalletHistory from "../models/WalletHistory.js";

export default class WalletRepository {
    
  async findByUserId(userId) {
    return await WalletHistory.find({ userId })
      .populate({
        path: "bookingId",
        select: "booking_id eid date total_ticket price booking_status",
      })
      .populate({
        path: "userId",
        select: "fullName email phone",
      })
      .sort({ createdAt: -1 });
  }

  async findAll() {
    return await WalletHistory.find({})
      .populate({
        path: "bookingId",
        select: "booking_id eid date total_ticket price booking_status",
      })
      .populate({
        path: "userId",
        select: "fullName email phone",
      })
      .sort({ createdAt: -1 });
  }

  async getWalletHistoryByUserId(userId) {
    return await WalletHistory.find({ userId })
      .populate({
        path: "bookingId",
        select: "booking_id eid date total_ticket price booking_status",
      })
      .populate({
        path: "userId",
        select: "fullName email phone",
      })
      .sort({ createdAt: -1 });
  }

  async addWalletHistory({ userId, type, amount, description, bookingId = null }) {
  await WalletHistory.create({
  userId,
  type: action,
  amount,
  description: action === "credit" ? "Wallet credited by admin" : "Wallet debited by admin",
});
  }



}

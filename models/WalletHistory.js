import mongoose from 'mongoose';

const walletHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['debit', 'credit'], required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }, // optional
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.WalletHistory || mongoose.model('WalletHistory', walletHistorySchema); 
import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  transaction_id: { type: String, required: true, index: true },
  invoice_url: { type: String, required: true },
  booking_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
  total_amount: { type: Number, required: true },
  payment_method: { type: String, enum: ['Wallet', 'Razorpay'], required: true, default: 'Razorpay' },
  payment_status: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Paid'
  },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model('Invoice', InvoiceSchema);

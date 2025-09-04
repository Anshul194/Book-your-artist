import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  p_method_id: { type: String, required: true,default: 'razorpay' }, // Assuming Razorpay as default payment method
  transaction_id: { type: String, required: false },
  payment_type: { type: String, enum: ['Online', 'Offline', 'Cash' ,'Complimentary' ], required: true },
  total_amt: { type: Number, required: true },
  payment_status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Completed'
  }
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);

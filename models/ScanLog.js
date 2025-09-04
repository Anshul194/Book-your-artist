import mongoose from "mongoose";

const scanLogSchema = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  scanned_at: {
    type: Date,
    default: Date.now,
    required: true,
  },
  scanned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
}, {
  timestamps: true,
});

const ScanLog = mongoose.models.ScanLog || mongoose.model("ScanLog", scanLogSchema);
export default ScanLog;

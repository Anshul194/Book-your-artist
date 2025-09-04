import mongoose from 'mongoose';
import { type } from 'os';

const bookingSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  booking_id: { type: String, unique: true },
  class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'GarbaClass'},
  eid: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  typeid: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  zone: { type: String},
  type: { type: String, required: true }, 
  date: { type: Date, default: null },
  total_ticket: { type: Number, required: true },
  price: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  profile_photo: { type: String },
  aadhar_card: { type: String },
  remarks: { type: String, default: '' },
  qr_code: { type: String }, // base64 or image URL
  payment_type: {
  type: String,
  enum: ['Online', 'Cash', 'Complimentary'],
  default: 'Online', // Optional: you can set a default
},
  cash_amount: { 
    type: Number,
    default: 0,
  },
//add field for complimentary ticket for giving for who required if payment_type is complimentary
//set enumb Sms,police,sponser,
  complimentary_details: {
    enum: ['SMC', 'Police', 'Sponsor'],
    type: String,
    default: null,
  },
  booking_status: {
    type: String,
    enum: ['Booked', 'Cancelled', 'Completed', 'Verified', 'Expired'],
    default: 'Booked',
  },
  created_by: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Admin',
  default: null,
},

  is_expiry: { type: Boolean, default: false },
}, { timestamps: true });

bookingSchema.pre('save', async function(next) {
  if (!this.booking_id) {
    let unique = false;
    while (!unique) {
      const randomId = 'KS' + Math.floor(10000 + Math.random() * 90000).toString();
      const existing = await mongoose.models.Booking.findOne({ booking_id: randomId });
      if (!existing) {
        this.booking_id = randomId;
        unique = true;
      }
    }
  }
  next();
});

export default mongoose.model('Booking', bookingSchema);
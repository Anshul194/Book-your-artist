import mongoose from "mongoose";

const priceSchema = new mongoose.Schema(
  {
    date: { type: Date },
    day: {
      type: String,
      enum: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      // required: true,
    },
    zone: { type: String },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
  ticketTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subcategory",
    required: true,
  },
  ticketType: { type: String, required: true, trim: true },
  prices: { type: [priceSchema], required: true },
  type: {
    type: String, 
    enum: ["Regular", "Khelaiya"],
    default: "Regular",
  },
  color: {
    type: String,
    trim: true,
    default: null, // optional; can be required: true if needed
  },
  fontColor: {
    type: String,
    trim: true,
    default: null, // optional; can be required: true if needed
  },
  limit: { type: Number, required: true, min: 1 },
  status: {
    type: String,
    enum: ["publish", "Unpublish"],
    default: "publish",
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Ticket", ticketSchema);

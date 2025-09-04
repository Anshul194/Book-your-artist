import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
//   price: {
//     type: Number,
//     required: true
//   },
//   subcategory: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Subcategory',
//     required: true
//   },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  image:{
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Zone', zoneSchema);

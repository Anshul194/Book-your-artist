// models/eventSponsorModel.js
import mongoose from 'mongoose';

const eventSponsorSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String, // This would store the filename or URL
    required: true
  },
  link: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['Publish', 'Unpublish'],
    default: 'Publish'
  },
  is_home: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('EventSponsor', eventSponsorSchema);

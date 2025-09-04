import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  coverImage: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  latitude: {
    type: String,
  },
  longitude: {
    type: String,
  },
  isBook: {
    type: Boolean,
    default: false 
  },
  placeName: {
    type: String,
    required: true,
    trim: true
  },
  fullAddress: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  eventStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  category: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  }],
  // eventSponsors: [{
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'EventSponsor'
  //   }],
  //   ticketsTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
  //   galleryImages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'galleryImage' }],
  //   coverImages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CoverImage' }],
  description: {  
    type: String,
    trim: true
  },
  disclaimer: {
    type: String,
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

export default mongoose.model('Event', eventSchema);

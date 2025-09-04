  import mongoose from 'mongoose';

  const galleryImage = new mongoose.Schema({
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    images: {
      type: [String],     // Array of strings, no limit on length
      required: true
    },
    status: {
      type: String,
      enum: ['publish', 'Unpublish'],
      default: 'publish'
    }
  }, {
    timestamps: true
  });

  export default mongoose.model('galleryImage', galleryImage);
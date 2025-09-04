// models/garbaClass.js
import mongoose from 'mongoose';

const garbaClassSchema = new mongoose.Schema({
  name: { type: String, required: true },
  eid: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
   password: { type: String, required: true, default: "12345" },
  profilePic: { type: String },
  latitude: { type: String },
  longitude: { type: String },
    zone: { 
    type: String, 
    
   
  },
  role: { type: String, default: 'Garba Class' },
  blocked: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
}, {
  timestamps: true,
  collection: 'users'  
});

// Export alias model
export default mongoose.models.GarbaClass || mongoose.model('GarbaClass', garbaClassSchema);

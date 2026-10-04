import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  age: { type: Number },
  gender: { type: String },
  status: { type: String, default: 'Actif' },
  injuryId: { type: String },
  doctor: { type: String },
  isPending: { type: Boolean, default: false } // For form pre-registration
}, { timestamps: true });

export default mongoose.models.Patient || mongoose.model('Patient', PatientSchema);

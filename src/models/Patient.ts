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
  isPending: { type: Boolean, default: false }, // For form pre-registration
  sessionsTotal: { type: Number, default: 0 },
  sessionsCompleted: { type: Number, default: 0 },
  sessionsCancelled: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  completedTreatments: { type: [Number], default: [] },
  inWaitingRoom: { type: Boolean, default: false },
  paidSessions: { type: Number, default: 0 },
  unpaidSessions: { type: Number, default: 0 },
  consultationStatus: { type: String, enum: ['waiting', 'in_progress', 'finished', 'none'], default: 'none' }
}, { timestamps: true });

export default mongoose.models.Patient || mongoose.model('Patient', PatientSchema);

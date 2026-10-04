import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  date: { type: String, required: true }, // ISO string or simple date
  notes: { type: String },
  isCompleted: { type: Boolean, default: false },
  isCancelled: { type: Boolean, default: false },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'unpaid'], default: 'pending' },
}, { timestamps: true });

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);

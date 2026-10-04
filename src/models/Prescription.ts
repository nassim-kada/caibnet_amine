import mongoose from 'mongoose';

const PrescriptionSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  doctorId: { type: String },
  date: { type: String },
  diagnosis: { type: String },
  treatments: [{ act: String, sessionsCount: Number, notes: String }],
  observations: { type: String }
}, { timestamps: true });

export default mongoose.models.Prescription || mongoose.model('Prescription', PrescriptionSchema);

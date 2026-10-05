import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true }, // ISO string
  method: { type: String, default: 'Espèces' }
}, { timestamps: true });

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);

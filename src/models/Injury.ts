import mongoose from 'mongoose';

const InjurySchema = new mongoose.Schema({
  categoryId: { type: String },
  name: { type: String, required: true },
  description: { type: String },
  treatments: { type: [String] }
}, { timestamps: true });

export default mongoose.models.Injury || mongoose.model('Injury', InjurySchema);

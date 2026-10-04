import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb';
import Patient from '../../../../models/Patient';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const item = await Patient.findByIdAndUpdate(params.id, body, { new: true });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    
    // 1. Delete the patient
    const deletedPatient = await Patient.findByIdAndDelete(params.id);
    
    if (deletedPatient) {
      // 2. Cascade delete: remove all sessions and prescriptions for this patient
      // Assuming you have Session and Prescription models...
      const mongoose = require('mongoose');
      const Session = mongoose.models.Session || mongoose.model('Session', new mongoose.Schema({ patientId: String }, { strict: false }));
      const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', new mongoose.Schema({ patientId: String }, { strict: false }));
      
      await Session.deleteMany({ patientId: params.id });
      await Prescription.deleteMany({ patientId: params.id });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

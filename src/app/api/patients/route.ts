import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import Patient from '../../../models/Patient';

export async function GET() {
  try {
    await connectToDatabase();
    const patients = await Patient.find({}).sort({ createdAt: -1 });
    return NextResponse.json(patients);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const patient = await Patient.create(body);
    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import Doctor from '../../../models/Doctor';

export async function GET() {
  try {
    await connectToDatabase();
    const items = await Doctor.find({}).sort({ createdAt: -1 });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const item = await Doctor.create(body);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}

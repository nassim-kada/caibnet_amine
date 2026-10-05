import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb';
import Doctor from '../../../../models/Doctor';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const { id } = await params;
    const item = await Doctor.findByIdAndUpdate(id, body, { returnDocument: 'after' });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    await Doctor.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import Injury from '../../../models/Injury';

export async function GET() {
  try {
    await connectToDatabase();
    const items = await Injury.find({}).sort({ createdAt: -1 });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const item = await Injury.create(body);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}

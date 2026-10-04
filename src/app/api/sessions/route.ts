import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import Session from '../../../models/Session';

export async function GET() {
  try {
    await connectToDatabase();
    const sessions = await Session.find({}).sort({ createdAt: -1 });
    return NextResponse.json(sessions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const session = await Session.create(body);
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

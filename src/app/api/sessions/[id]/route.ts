import { NextResponse } from "next/server";
import connectToDatabase from "../../../../lib/mongodb";
import Session from "../../../../models/Session";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const session = await Session.findByIdAndUpdate(params.id, body, { new: true });
    return NextResponse.json(session);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const adminUser = process.env.ADMIN_USERNAME;
    const adminPass = process.env.ADMIN_PASSWORD;
    const secUser = process.env.SECRETARY_USERNAME;
    const secPass = process.env.SECRETARY_PASSWORD;

    if (username === adminUser && password === adminPass) {
      return NextResponse.json({ success: true, role: 'admin' });
    }

    if (username === secUser && password === secPass) {
      return NextResponse.json({ success: true, role: 'secretary' });
    }

    return NextResponse.json({ success: false, error: 'Identifiants invalides' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

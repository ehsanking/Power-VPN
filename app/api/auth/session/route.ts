import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'password';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('vpn_session');

  if (session?.value === 'authenticated') {
    return NextResponse.json({ 
      user: { email: ADMIN_USER + '@local', displayName: 'Administrator' },
      isAdmin: true 
    });
  }

  return NextResponse.json({ user: null, isAdmin: false });
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      const cookieStore = await cookies();
      cookieStore.set('vpn_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 1 day
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('vpn_session');
  return NextResponse.json({ success: true });
}

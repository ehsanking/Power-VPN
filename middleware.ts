import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// Get dynamically generated secret per instance/deployment
async function getSecret() {
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
         return new TextEncoder().encode(process.env.JWT_SECRET);
    }
    // Note: To be perfectly secure we shouldn't have a fallback, but for development we need something robust.
    // If we fail here, the whole site breaks.
    throw new Error("A 32+ char JWT_SECRET must be provided in the environment variables.");
}

export async function middleware(request: NextRequest) {
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  if (!isApiRoute) {
    return NextResponse.next();
  }

  // Exempt routes
  const publicRoutes = ['/api/auth/session', '/api/client/login', '/api/client/download'];
  
  if (publicRoutes.includes(request.nextUrl.pathname)) {
      return NextResponse.next();
  }
  
  // Protect /api/migrate specifically
  if (request.nextUrl.pathname === '/api/migrate') {
      // Basic block, perhaps require a local dev environment or specific token.
      // Easiest is to block it once production or check an env var
      if (process.env.ALLOW_MIGRATION !== 'true') {
         return NextResponse.json({ error: 'Migration forbidden' }, { status: 403 });
      }
      return NextResponse.next();
  }


  const sessionCookie = request.cookies.get('vpn_session_jwt');
  
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
  }

  try {
    const secret = await getSecret();
    const { payload } = await jose.jwtVerify(sessionCookie.value, secret);
    
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }
    
    return NextResponse.next();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }
}

export const config = {
  matcher: '/api/:path*',
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes mapped to allowed roles
const routeRoles: Record<string, string[]> = {
  '/admin': ['admin'],
  '/doctor': ['doctor', 'admin'],
  '/staff': ['staff', 'admin'],
  '/medical': ['medical', 'nurse', 'admin'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Find the exact base route being accessed
  const baseRoute = Object.keys(routeRoles).find(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // If it's not a protected route, let it pass
  if (!baseRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;

  // Not logged in
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  try {
    // Basic JWT decode without verification (signature is verified at API layer)
    // Edge runtime doesn't support jsonwebtoken easily, decoding the payload is safe enough for routing
    const payloadBase64 = token.split('.')[1];
    
    // Convert Base64URL to Base64
    const b64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.padEnd(b64.length + (4 - (b64.length % 4)) % 4, '=');
    const decodedJson = atob(padded);
    const payload = JSON.parse(decodedJson);

    const userRole = payload.role;
    const allowedRoles = routeRoles[baseRoute];

    // Check if the user's role is allowed for this route
    if (!allowedRoles.includes(userRole)) {
      // User is logged in but trying to access an unauthorized area
      // Redirect them to their appropriate dashboard
      const redirectDashboard = userRole === 'admin' ? '/admin' 
        : userRole === 'doctor' ? '/doctor'
        : userRole === 'medical' ? '/medical' 
        : userRole === 'nurse' ? '/medical' 
        : '/staff';
      
      return NextResponse.redirect(new URL(redirectDashboard, request.url));
    }

    // Role authorized
    return NextResponse.next();
  } catch (error) {
    // Inverse or corrupted token
    const url = new URL('/login', request.url);
    // Remove the cookie
    const response = NextResponse.redirect(url);
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/doctor/:path*',
    '/staff/:path*',
    '/medical/:path*',
  ],
};

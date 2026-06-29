import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode('secret123');

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  
  // مسیرهای عمومی که نیاز به احراز هویت ندارند
  const publicPaths = ['/login', '/register'];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);
  
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/chat', request.url));
  }
  
  // اعتبارسنجی توکن
  if (token) {
    try {
      await jwtVerify(token, SECRET);
    } catch (error) {
      if (!isPublicPath) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('token');
        return response;
      }
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-|offline.html|fallback-|uploads).*)',
  ],
};
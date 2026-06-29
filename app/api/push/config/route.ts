// app/api/config/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    vapidPublic: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? '✅ exists' : '❌ missing',
    vapidPrivate: process.env.VAPID_PRIVATE_KEY ? '✅ exists' : '❌ missing',
    vapidEmail: process.env.VAPID_EMAIL || '❌ not set',
    jwtSecret: process.env.JWT_SECRET ? '✅ exists' : '❌ missing',
  });
}
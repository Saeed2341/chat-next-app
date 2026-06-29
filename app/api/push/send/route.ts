// app/api/push/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import webPush from 'web-push';

// ===== استفاده از require برای فایل‌های CommonJS =====
const { connectDB } = require('@/lib/db');
const User = require('@/models/User');

// ===== تنظیم VAPID =====
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const email = process.env.VAPID_EMAIL || 'cursorsaeed@gmail.com';

if (publicKey && privateKey) {
  webPush.setVapidDetails('mailto:' + email, publicKey, privateKey);
  console.log('✅ VAPID configured in API route');
} else {
  console.error('❌ VAPID keys missing in API route');
}

export async function POST(req: NextRequest) {
  try {
    // بررسی کلیدها
    if (!publicKey || !privateKey) {
      return NextResponse.json(
        { error: 'Push notifications are not configured on the server' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { userId, message } = body;

    if (!userId || !message) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // ===== دریافت اشتراک از دیتابیس =====
    await connectDB();
    
    // استفاده از `findOne` با روش ساده‌تر
    const user = await User.findOne({ username: userId }).lean();
    const subscription = user?.pushSubscription;

    if (!subscription) {
      return NextResponse.json(
        { success: false, message: 'User has not subscribed to push notifications' },
        { status: 404 }
      );
    }

    // ساخت payload
    const payload = JSON.stringify({
      title: `📩 پیام از ${message.sender}`,
      body: message.text || 'یک عکس جدید',
      icon: '/icons/icon-192x192.png',
      url: `/chat/${message.sender}`,
      messageId: message.messageId,
      sender: message.sender,
    });

    // ارسال نوتیفیکیشن
    await webPush.sendNotification(subscription, payload);
    console.log(`✅ Notification sent to ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
    });
  } catch (error: any) {
    console.error('❌ Error in push API:', error);
    
    if (error.statusCode === 410) {
      const { userId } = await req.json();
      await connectDB();
      await User.updateOne(
        { username: userId },
        { pushSubscription: null }
      );
      console.log(`🗑️ Subscription expired for ${userId}, removed`);
      
      return NextResponse.json(
        { success: false, message: 'Subscription expired' },
        { status: 410 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
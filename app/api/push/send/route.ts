// app/api/push/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import webPush from 'web-push';

// ===== استفاده از require =====
const { connectDB } = require('@/lib/db');
const UserModel = require('@/models/User');

// ===== تنظیم VAPID =====
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const email = process.env.VAPID_EMAIL || 'cursorsaeed@gmail.com';

if (publicKey && privateKey) {
  webPush.setVapidDetails('mailto:' + email, publicKey, privateKey);
  console.log('✅ VAPID configured in API route');
}

export async function POST(req: NextRequest) {
  try {
    if (!publicKey || !privateKey) {
      return NextResponse.json(
        { error: 'Push notifications are not configured on the server' },
        { status: 500 }
      );
    }

    const { userId, message } = await req.json();

    if (!userId || !message) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    await connectDB();
    
    // ===== استفاده از any برای رفع خطا =====
    const User: any = UserModel;
    const user = await User.findOne({ username: userId });
    const subscription = user?.pushSubscription;

    if (!subscription) {
      return NextResponse.json(
        { success: false, message: 'User has not subscribed to push notifications' },
        { status: 404 }
      );
    }

    const payload = JSON.stringify({
      title: `📩 پیام از ${message.sender}`,
      body: message.text || 'یک عکس جدید',
      icon: '/icons/icon-192x192.png',
      url: `/chat/${message.sender}`,
      messageId: message.messageId,
      sender: message.sender,
    });

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
      const User: any = UserModel;
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
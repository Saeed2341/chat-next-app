// app/api/push/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import webPush from 'web-push';

// ===== تنظیم VAPID در خود API =====
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const email = process.env.VAPID_EMAIL || 'cursorsaeed@gmail.com';

// تنظیم VAPID در اولین بار اجرا
if (publicKey && privateKey) {
  webPush.setVapidDetails('mailto:' + email, publicKey, privateKey);
  console.log('✅ VAPID configured in API route');
} else {
  console.error('❌ VAPID keys missing in API route');
  console.error('Public Key:', publicKey ? '✅ exists' : '❌ missing');
  console.error('Private Key:', privateKey ? '✅ exists' : '❌ missing');
}

// ===== ذخیره اشتراک‌ها در حافظه (برای تست) =====
const subscriptions = new Map<string, any>();

export async function POST(req: NextRequest) {
  try {
    // بررسی کلیدها
    if (!publicKey || !privateKey) {
      console.error('❌ VAPID keys not configured');
      return NextResponse.json(
        { error: 'Push notifications are not configured on the server' },
        { status: 500 }
      );
    }

    const { userId, message, subscription } = await req.json();

    // اگر درخواست برای ذخیره اشتراک است
    if (subscription && userId) {
      subscriptions.set(userId, subscription);
      console.log(`✅ Subscription saved for ${userId}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Subscription saved successfully' 
      });
    }

    // اگر درخواست برای ارسال نوتیفیکیشن است
    if (!userId || !message) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // دریافت اشتراک کاربر
    const userSubscription = subscriptions.get(userId);
    if (!userSubscription) {
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
    await webPush.sendNotification(userSubscription, payload);
    console.log(`✅ Notification sent to ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
    });
  } catch (error: any) {
    console.error('❌ Error in push API:', error);
    
    // اگر اشتراک منقضی شده باشد
    if (error.statusCode === 410) {
      const { userId } = await req.json();
      subscriptions.delete(userId);
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
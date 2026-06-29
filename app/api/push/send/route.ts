// app/api/push/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import webPush from 'web-push';
import { getPushSubscription, deletePushSubscription } from '@/lib/pushSubscriptions';

// ===== فقط در صورت وجود کلیدها، تنظیمات VAPID را انجام بده =====
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const email = process.env.VAPID_EMAIL || 'your-email@example.com';

// فقط اگر کلیدها موجود باشند، تنظیمات را انجام بده
if (publicKey && privateKey) {
  webPush.setVapidDetails(
    'mailto:' + email,
    publicKey,
    privateKey
  );
  console.log('✅ VAPID configured for push notifications');
} else {
  console.warn('⚠️ VAPID keys not found, push notifications will not work');
}

export async function POST(req: NextRequest) {
  try {
    // اگر کلیدها تنظیم نشده باشند، خطا بده
    if (!publicKey || !privateKey) {
      return NextResponse.json({ 
        error: 'Push notifications are not configured on the server' 
      }, { status: 500 });
    }

    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, message } = await req.json();

    if (!userId || !message) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const subscription = getPushSubscription(userId);
    
    if (!subscription) {
      return NextResponse.json({ 
        success: false, 
        message: 'User has not subscribed to push notifications' 
      });
    }

    const payload = JSON.stringify({
      title: `پیام از ${message.sender}`,
      body: message.text || 'یک عکس جدید',
      icon: '/icons/icon-192x192.png',
      url: `/chat/${message.sender}`,
      messageId: message.messageId,
      sender: message.sender
    });

    await webPush.sendNotification(subscription, payload);

    return NextResponse.json({ 
      success: true, 
      message: 'Notification sent successfully' 
    });
  } catch (error: any) {
    console.error('❌ Error sending push notification:', error);
    
    if (error.statusCode === 410) {
      const { userId } = await req.json();
      deletePushSubscription(userId);
      
      return NextResponse.json({ 
        success: false, 
        message: 'Subscription expired, removed from database' 
      }, { status: 410 });
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
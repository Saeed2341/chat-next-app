// app/api/push/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import webPush from 'web-push';
import { getPushSubscription, deletePushSubscription } from '@/lib/pushSubscriptions';

webPush.setVapidDetails(
  'mailto:' + (process.env.VAPID_EMAIL || 'your-email@example.com'),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
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
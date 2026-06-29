// app/api/push/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import webPush from 'web-push';
import { getPushSubscription, deletePushSubscription } from '@/lib/pushSubscriptions';

// ===== دریافت کلیدها از متغیرهای محیطی =====
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const email = process.env.VAPID_EMAIL || 'cursorsaeed@gmail.com';

// ===== تنظیم VAPID در زمان اجرا (Runtime) =====
if (publicKey && privateKey) {
  webPush.setVapidDetails(
    'mailto:' + email,
    publicKey,
    privateKey
  );
  console.log('✅ VAPID configured successfully');
} else {
  console.warn('⚠️ VAPID keys are missing!');
  console.log('publicKey:', publicKey ? '✅ exists' : '❌ missing');
  console.log('privateKey:', privateKey ? '✅ exists' : '❌ missing');
}

export async function POST(req: NextRequest) {
  console.log('📨 ===== Send notification request =====');
  
  try {
    // ===== بررسی مجدد کلیدها در زمان اجرا =====
    if (!publicKey || !privateKey) {
      console.error('❌ VAPID keys not available at runtime!');
      return NextResponse.json({ 
        error: 'Push notifications are not configured on the server' 
      }, { status: 500 });
    }

    const body = await req.json();
    const { userId, message } = body;
    
    console.log('📨 Data received:', { userId, message: message?.text });

    if (!userId || !message) {
      console.log('❌ Missing data');
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // Get user subscription
    const subscription = getPushSubscription(userId);
    console.log('📋 Subscription:', subscription ? '✅ exists' : '❌ not found');

    if (!subscription) {
      return NextResponse.json({ 
        success: false, 
        message: 'User has not subscribed to push notifications' 
      });
    }

    // Build payload
    const payload = JSON.stringify({
      title: `📩 پیام از ${message.sender}`,
      body: message.text || 'یک عکس جدید',
      icon: '/icons/icon-192x192.png',
      url: `/chat/${message.sender}`,
      messageId: message.messageId,
      sender: message.sender
    });

    console.log('📤 Sending to web-push...');

    // Send notification
    await webPush.sendNotification(subscription, payload);
    console.log('✅ Notification sent successfully!');

    return NextResponse.json({ 
      success: true, 
      message: 'Notification sent successfully' 
    });
  } catch (error: any) {
    console.error('❌ Error sending notification:', error);
    
    if (error.statusCode === 410) {
      const { userId } = await req.json();
      deletePushSubscription(userId);
      console.log('🗑️ Subscription expired, removed');
      
      return NextResponse.json({ 
        success: false, 
        message: 'Subscription expired, removed from database' 
      }, { status: 410 });
    }

    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}
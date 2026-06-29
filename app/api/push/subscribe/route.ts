// app/api/push/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { setPushSubscription } from '@/lib/pushSubscriptions';

export async function POST(req: NextRequest) {
  console.log('📩 ===== Subscribe request =====');
  
  try {
    const user = await getAuthUser(req);
    console.log('👤 User:', user?.username || 'unauthorized');
    
    if (!user) {
      console.log('❌ Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription, userId } = await req.json();
    console.log('📦 Data:', { userId, hasSubscription: !!subscription });

    if (!subscription || !userId) {
      console.log('❌ Missing data');
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    if (userId !== user.username) {
      console.log('❌ User mismatch');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    setPushSubscription(userId, subscription);
    console.log(`✅ Subscription saved for ${userId}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription saved successfully' 
    });
  } catch (error) {
    console.error('❌ Error saving subscription:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
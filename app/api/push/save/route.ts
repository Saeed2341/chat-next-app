// app/api/push/save/route.ts
import { NextRequest, NextResponse } from 'next/server';

// ===== استفاده از require برای رفع خطای TypeScript =====
const { connectDB } = require('@/lib/db');
const UserModel = require('@/models/User');

export async function POST(req: NextRequest) {
  try {
    const { subscription, userId } = await req.json();

    if (!subscription || !userId) {
      return NextResponse.json(
        { error: 'Missing data' },
        { status: 400 }
      );
    }

    await connectDB();
    
    // ===== استفاده از any برای رفع خطا =====
    const User: any = UserModel;
    const user = await User.findOne({ username: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // ذخیره اشتراک
    user.pushSubscription = subscription;
    await user.save();

    console.log(`✅ Push subscription saved for ${userId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Subscription saved successfully'
    });
  } catch (error) {
    console.error('❌ Error saving subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
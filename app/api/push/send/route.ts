import { NextRequest, NextResponse } from "next/server";
import webPush from "web-push";
import { getPushSubscription, deletePushSubscription } from "@/lib/pushSubscriptions";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const email = process.env.VAPID_EMAIL || "cursorsaeed@gmail.com";

if (publicKey && privateKey) {
  webPush.setVapidDetails("mailto:" + email, publicKey, privateKey);
}

export async function POST(req: NextRequest) {
  try {
    if (!publicKey || !privateKey) {
      return NextResponse.json(
        { error: "Push notifications are not configured on the server" },
        { status: 500 }
      );
    }

    const { userId, message } = await req.json();

    if (!userId || !message) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const subscription = getPushSubscription(userId);

    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          message: "User has not subscribed to push notifications",
        },
        { status: 404 }
      );
    }

    const payload = JSON.stringify({
      title: `📩 پیام از ${message.sender}`,
      body: message.text || "یک عکس جدید",
      icon: "/icons/icon-192x192.png",
      url: `/chat/${message.sender}`,
      messageId: message.messageId,
      sender: message.sender,
    });

    await webPush.sendNotification(subscription, payload);

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (error: any) {
    if (error.statusCode === 410) {
      const { userId } = await req.json();
      deletePushSubscription(userId);
      return NextResponse.json(
        {
          success: false,
          message: "Subscription expired, removed from database",
        },
        { status: 410 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
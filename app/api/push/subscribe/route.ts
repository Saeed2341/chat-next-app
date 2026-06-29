import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { setPushSubscription } from "@/lib/pushSubscriptions";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscription, userId } = await req.json();

    if (!subscription || !userId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    if (userId !== user.username) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    setPushSubscription(userId, subscription);

    return NextResponse.json({
      success: true,
      message: "Subscription saved successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
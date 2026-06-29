import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { deletePushSubscription } from "@/lib/pushSubscriptions";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (userId !== user.username) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deleted = deletePushSubscription(userId);

    return NextResponse.json({
      success: true,
      message: deleted ? "Subscription removed" : "Subscription not found",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
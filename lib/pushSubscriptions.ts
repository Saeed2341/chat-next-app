// lib/pushSubscriptions.ts

// ذخیره‌سازی موقت (در پروژه واقعی از دیتابیس استفاده کنید)
const subscriptions = new Map<string, PushSubscription>();

export function getPushSubscription(userId: string): PushSubscription | undefined {
  return subscriptions.get(userId);
}

export function setPushSubscription(userId: string, subscription: PushSubscription): void {
  subscriptions.set(userId, subscription);
}

export function deletePushSubscription(userId: string): boolean {
  return subscriptions.delete(userId);
}

export function getAllSubscriptions(): Map<string, PushSubscription> {
  return subscriptions;
}
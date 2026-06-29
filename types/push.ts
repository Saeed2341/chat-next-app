// types/push.ts
export interface PushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  messageId?: string;
  sender?: string;
}

export interface PushSubscriptionData {
  subscription: PushSubscription;
  userId: string;
}
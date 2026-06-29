// hooks/usePushNotification.ts
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface PushSubscriptionData {
  subscription: PushSubscription;
  userId: string;
}

export function usePushNotification(userId?: string) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);
      if (supported) {
        setPermission(Notification.permission);
        checkSubscriptionStatus();
      }
    }
  }, []);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      // ابتدا سرویس‌ورکر اصلی را بررسی کن
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      toast.error('مرورگر شما از نوتیفیکیشن پشتیبانی نمی‌کند');
      return false;
    }

    if (!userId) {
      toast.error('برای فعال‌سازی نوتیفیکیشن باید وارد شوید');
      return false;
    }

    setIsLoading(true);

    try {
      // 1. ثبت سرویس‌ورکر اصلی
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ سرویس‌ورکر آماده است');

      // 2. درخواست مجوز
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        toast.error('برای دریافت نوتیفیکیشن باید اجازه دهید');
        return false;
      }

      // 3. دریافت کلید VAPID
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        toast.error('کلید عمومی نوتیفیکیشن تنظیم نشده است');
        return false;
      }

      // 4. ساخت اشتراک
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
      });

      // 5. ارسال به سرور
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userId
        } as PushSubscriptionData)
      });

      if (response.ok) {
        setIsSubscribed(true);
        toast.success('نوتیفیکیشن با موفقیت فعال شد ✅');
        return true;
      } else {
        const error = await response.json();
        throw new Error(error.message || 'خطا در فعال‌سازی نوتیفیکیشن');
      }
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('خطا: ' + (error instanceof Error ? error.message : 'مشخص نیست'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, userId]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
        setIsSubscribed(false);
        toast.success('نوتیفیکیشن غیرفعال شد');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('خطا در غیرفعال‌سازی نوتیفیکیشن');
      return false;
    }
  }, [userId]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    checkSubscriptionStatus
  };
}
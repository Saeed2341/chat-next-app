// hooks/usePushNotification.ts
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

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
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      setIsSubscribed(false);
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

    if (isLoading) return false;

    setIsLoading(true);

    try {
      // 1. ثبت سرویس‌ورکر
      let registration = await navigator.serviceWorker.getRegistration('/');
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        await new Promise((resolve) => {
          if (registration.active) {
            resolve(true);
          } else {
            registration.addEventListener('activate', () => resolve(true));
          }
        });
      }

      registration = await navigator.serviceWorker.ready;

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
        applicationServerKey: publicKey,
      });

      console.log('✅ اشتراک ساخته شد:', subscription);

      // ===== 5. ذخیره اشتراک در دیتابیس از طریق Socket =====
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '');
      socket.emit('save_push_subscription', {
        subscription,
        userId
      });
      socket.disconnect();

      // ===== 6. ذخیره اشتراک در API Route (برای تست) =====
      const response = await fetch('/api/push/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userId
        })
      });

      const data = await response.json();
      console.log('📨 پاسخ سرور:', data);

      if (response.ok) {
        setIsSubscribed(true);
        toast.success('نوتیفیکیشن با موفقیت فعال شد ✅');
        return true;
      } else {
        throw new Error(data.error || 'خطا در فعال‌سازی');
      }
    } catch (error) {
      console.error('❌ خطا:', error);
      toast.error('خطا: ' + (error instanceof Error ? error.message : 'مشخص نیست'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, userId, isLoading]);

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        
        // حذف از دیتابیس
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '');
        socket.emit('remove_push_subscription', { userId });
        socket.disconnect();

        setIsSubscribed(false);
        toast.success('نوتیفیکیشن غیرفعال شد');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ خطا:', error);
      toast.error('خطا در غیرفعال‌سازی');
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
    checkSubscriptionStatus,
  };
}
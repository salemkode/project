import { user } from '../gun/config';

// Check if push notifications are supported
export const isPushSupported = () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Request push notification permission
export const requestNotificationPermission = async () => {
    if (!isPushSupported()) {
        throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        throw new Error('Notification permission denied');
    }

    return permission;
};

// Subscribe to push notifications
export const subscribeToPush = async () => {
    if (!user.is) throw new Error('User not authenticated');

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
        });

        // Store the subscription in Gun under the user's profile
        await new Promise<void>((resolve, reject) => {
            user.get('pushSubscription').put(JSON.stringify(subscription), (ack) => {
                if (ack.err) reject(new Error(ack.err));
                else resolve();
            });
        });

        return subscription;
    } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
        throw error;
    }
};

// Unsubscribe from push notifications
export const unsubscribeFromPush = async () => {
    if (!user.is) throw new Error('User not authenticated');

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await subscription.unsubscribe();
        }

        // Remove the subscription from Gun
        await new Promise<void>((resolve, reject) => {
            user.get('pushSubscription').put(null, (ack) => {
                if (ack.err) reject(new Error(ack.err));
                else resolve();
            });
        });
    } catch (error) {
        console.error('Failed to unsubscribe from push notifications:', error);
        throw error;
    }
};

// Get the user's push subscription
export const getPushSubscription = async () => {
    if (!user.is) throw new Error('User not authenticated');

    return new Promise<PushSubscription | null>((resolve) => {
        user.get('pushSubscription').once((subscriptionString) => {
            if (subscriptionString) {
                resolve(JSON.parse(subscriptionString));
            } else {
                resolve(null);
            }
        });
    });
};

// Send a push notification
export const sendPushNotification = async (subscription: PushSubscription, message: string) => {
    try {
        await fetch('/api/push/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subscription,
                message,
            }),
        });
    } catch (error) {
        console.error('Failed to send push notification:', error);
        throw error;
    }
}; 
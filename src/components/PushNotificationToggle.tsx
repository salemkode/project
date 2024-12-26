import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  isPushSupported,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscription,
} from "../services/push";

export default function PushNotificationToggle() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = isPushSupported();
      setIsSupported(supported);

      if (supported) {
        const subscription = await getPushSubscription();
        setIsSubscribed(!!subscription);
      }

      setLoading(false);
    };

    checkSupport();
  }, []);

  const handleToggle = async () => {
    try {
      if (isSubscribed) {
        await unsubscribeFromPush();
        setIsSubscribed(false);
      } else {
        await requestNotificationPermission();
        await subscribeToPush();
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error("Failed to toggle push notifications:", error);
      // You might want to show an error message to the user here
    }
  };

  if (!isSupported || loading) {
    return null;
  }

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        isSubscribed
          ? "bg-green-500 hover:bg-green-600 text-white"
          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
      }`}
    >
      {isSubscribed ? (
        <>
          <Bell className="w-5 h-5" />
          <span>Notifications On</span>
        </>
      ) : (
        <>
          <BellOff className="w-5 h-5" />
          <span>Notifications Off</span>
        </>
      )}
    </button>
  );
}

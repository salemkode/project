import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

interface AutoServeTimerProps {
  createdAt: number;
  loopMinutes: number;
  onTimerComplete: () => void;
}

export default function ExpireTimer({
  createdAt,
  loopMinutes,
  onTimerComplete,
}: AutoServeTimerProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const expiryTime = loopMinutes * 60 * 1000; // Convert minutes to milliseconds
      const timeElapsed = now - createdAt;
      const timeRemaining = expiryTime - (timeElapsed % expiryTime);

      if (timeElapsed >= expiryTime) {
        onTimerComplete();
      }

      const minutes = Math.floor(timeRemaining / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, loopMinutes, onTimerComplete]);

  return (
    <div className="flex items-center">
      <Timer className="w-4 h-4 mr-1" />
      <span>Expires in: {timeLeft}</span>
    </div>
  );
}

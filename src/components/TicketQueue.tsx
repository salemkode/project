import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Ticket, Timer, ArrowLeft, User, Users } from "lucide-react";
import { user, locations } from "../services/gun";
import QueueManagement from "../pages/QueueManagement";
import { Location, QueueEntry } from "../types/gun";
import AutoServeTimer from "./ExpireTimer";
import AdminControls from "./AdminControls";
import PushNotificationToggle from "./PushNotificationToggle";
import { useQueueEntries } from "../hooks/useQueueEntries";

interface QueueState {
  locationName: string;
  currentNumber: number;
  myNumber: number | null;
  error: string | null;
  createdBy: string | null;
  creatorName: string;
  lastServedNumber: number;
  autoExpireTime: number;
  createdAt: number;
}

function QueueProgress({
  currentNumber,
  myNumber,
  lastServedNumber,
}: {
  currentNumber: number;
  myNumber: number;
  lastServedNumber: number;
}) {
  const position = myNumber - lastServedNumber;
  const totalWaiting = currentNumber - lastServedNumber - 1;
  const progress =
    totalWaiting > 0 ? ((totalWaiting - position) / totalWaiting) * 100 : 0;

  return (
    <div className="mt-4 space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span className="flex items-center">
          <Users className="w-4 h-4 mr-1" />
          {position} {position === 1 ? "person" : "people"} ahead of you
        </span>
        <span>{Math.round(progress)}% closer to your turn</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-gray-600">
        {position <= 0 ? (
          <span className="text-green-600 font-semibold">
            It's your turn now!
          </span>
        ) : position === 1 ? (
          <span className="text-yellow-600">You're next in line!</span>
        ) : (
          <span>Estimated wait time: ~{position * 5} minutes</span>
        )}
      </p>
    </div>
  );
}

export default function TicketQueue() {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const { queueEntries } = useQueueEntries(locationId!);
  const [state, setState] = useState<QueueState>({
    locationName: "",
    currentNumber: 1,
    myNumber: null,
    error: null,
    createdBy: null,
    creatorName: "",
    lastServedNumber: 0,
    autoExpireTime: 0,
    createdAt: Date.now(),
  });

  const isManager = user.is?.pub === state.createdBy;

  useEffect(() => {
    if (!locationId || !user.is) {
      setState((prev) => ({ ...prev, error: "Please log in to continue" }));
      return;
    }

    // Subscribe to location updates
    locations.get(locationId).on((data: Omit<Location, "id"> | null) => {
      if (data) {
        setState((prev) => ({
          ...prev,
          locationName: data.name,
          currentNumber: data.currentNumber || 1,
          createdBy: data.createdBy,
          creatorName: data.creatorName || "Anonymous",
          lastServedNumber: data.lastServedNumber || 0,
          error: null,
          autoExpireTime: data.autoExpireTime || 0,
        }));
      } else {
        setState((prev) => ({ ...prev, error: "Location not found" }));
      }
    });

    // Get user's number for this location
    if (user.is) {
      user
        .get("myNumbers")
        .get(locationId)
        .on((number) => {
          setState((prev) => ({ ...prev, myNumber: number }));
        });
    }

    return () => {
      locations.get(locationId).off();
      if (user.is) {
        user.get("myNumbers").get(locationId).off();
      }
    };
  }, [locationId]);

  // Admin function to update location name
  const updateLocationName = async (newName: string) => {
    if (!user.is) {
      setState((prev) => ({ ...prev, error: "Please log in to continue" }));
      return;
    }

    try {
      await locations.updateName(locationId!, newName.trim());
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update location name",
      }));
    }
  };

  // Regular user functions
  const takeNumber = async () => {
    if (!user.is) {
      setState((prev) => ({ ...prev, error: "Please log in to continue" }));
      return;
    }

    try {
      await locations.takeNumber(locationId!);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to take number",
      }));
    }
  };

  const relinquishNumber = async () => {
    if (!user.is) {
      setState((prev) => ({ ...prev, error: "Please log in to continue" }));
      return;
    }

    try {
      await locations.relinquishNumber(locationId!);
    } catch (error) {
      console.error(error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to relinquish number",
      }));
    }
  };

  const handleAutoExpire = async () => {
    if (!locationId || !user.is || !state.autoExpireTime) return;

    try {
      const currentTime = Date.now();
      const expiryTime = state.autoExpireTime * 60 * 1000; // Convert minutes to milliseconds

      // Get all active numbers
      const activeEntries = queueEntries.filter(
        (entry: QueueEntry) => !entry.served
      );

      // Mark expired numbers as served
      for (const entry of activeEntries) {
        const timeSinceCreation = currentTime - entry.timestamp;
        if (timeSinceCreation >= expiryTime) {
          await locations.markNumberAsServed(locationId, entry.number);
        }
      }
    } catch (error) {
      console.error("Auto-expire failed:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to auto-expire numbers",
      }));
    }
  };

  if (state.error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 rounded-lg p-6 text-center">
            <p className="text-red-600">{state.error}</p>
            <button
              onClick={() => navigate("/locations")}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Return to Locations
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/locations")}
          className="mb-4 flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Locations
        </button>

        <div className="grid gap-6">
          {/* Queue Status Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <Ticket className="w-16 h-16 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {state.locationName}
              </h1>
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <User className="w-4 h-4 mr-1" />
                  <span>Manager: {state.creatorName}</span>
                </div>
                {state.autoExpireTime > 0 &&
                  state.currentNumber > state.lastServedNumber && (
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <AutoServeTimer
                        createdAt={state.createdAt}
                        loopMinutes={state.autoExpireTime}
                        onTimerComplete={handleAutoExpire}
                      />
                    </div>
                  )}
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Timer className="w-4 h-4 mr-1" />
                  <span>Last served: {state.lastServedNumber}</span>
                </div>
              </div>

              {state.myNumber ? (
                <div className="space-y-6">
                  <div className="bg-green-50 rounded-lg p-6">
                    <p className="text-lg text-green-800 mb-2">
                      Your number is
                    </p>
                    <div className="text-5xl font-bold text-green-600 mb-2">
                      {state.myNumber}
                    </div>
                    <p className="text-sm text-green-700">
                      {state.myNumber <= state.lastServedNumber
                        ? "It's your turn!"
                        : `Please wait for your turn (Currently serving: ${
                            state.lastServedNumber || "none"
                          })`}
                    </p>
                    {state.myNumber > state.lastServedNumber && (
                      <QueueProgress
                        currentNumber={state.currentNumber}
                        myNumber={state.myNumber}
                        lastServedNumber={state.lastServedNumber}
                      />
                    )}
                    <div className="mt-4">
                      <PushNotificationToggle />
                    </div>
                  </div>
                  <button
                    onClick={relinquishNumber}
                    className={`w-full ${
                      state.myNumber <= state.lastServedNumber
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-red-500 hover:bg-red-600"
                    } text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2`}
                  >
                    <Timer className="w-5 h-5" />
                    {state.myNumber <= state.lastServedNumber
                      ? "Complete"
                      : "Relinquish Number"}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <p className="text-lg text-blue-800 mb-2">Current number</p>
                    <div className="text-6xl font-bold text-blue-600 mb-2">
                      {state.currentNumber}
                    </div>
                    <p className="text-sm text-blue-700">
                      Currently serving: {state.lastServedNumber || "none"}
                    </p>
                  </div>
                  <button
                    onClick={takeNumber}
                    className={`w-full ${
                      state.lastServedNumber >= state.currentNumber - 1
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-blue-500 hover:bg-blue-600"
                    } text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2`}
                  >
                    <Ticket className="w-5 h-5" />
                    Take a Number
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Manager Controls */}
          {isManager && (
            <>
              <AdminControls
                locationName={state.locationName}
                creatorName={state.creatorName}
                onUpdateName={updateLocationName}
              />
              {locationId && (
                <QueueManagement locationId={locationId} showQRCode={true} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

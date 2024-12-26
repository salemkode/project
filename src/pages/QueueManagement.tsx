import { Check, Clock, User, AlertCircle } from "lucide-react";
import { useQueueEntries } from "../hooks/useQueueEntries";
import { useLocation } from "../hooks/useLocations";
import { QRCodeSVG } from "qrcode.react";

interface QueueManagementProps {
  locationId: string;
  showQRCode?: boolean;
}

export default function QueueManagement({
  locationId,
  showQRCode,
}: QueueManagementProps) {
  const { queueEntries, error, loading, markAsServed } =
    useQueueEntries(locationId);
  const { data: location } = useLocation(locationId);
  const manageUrl = `${window.location.origin}/manage/${locationId}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading queue data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Queue Management {location?.name ? `- ${location.name}` : ""}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {queueEntries.length}{" "}
              {queueEntries.length === 1 ? "person" : "people"} in queue
            </p>
          </div>
          {showQRCode && (
            <div className="flex flex-col items-center">
              <QRCodeSVG value={manageUrl} size={100} />
              <p className="text-sm text-gray-500 mt-2">Scan to manage queue</p>
            </div>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {queueEntries.map((entry) => (
          <div
            key={entry.number}
            className={`p-4 flex items-center justify-between ${
              entry.served ? "bg-gray-50" : "bg-white"
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-800 font-semibold">
                    {entry.number}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {entry.userId.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              {entry.served ? (
                <div className="flex items-center text-green-600">
                  <Check className="w-5 h-4 mr-1" />
                  <span className="text-sm">
                    Served at {new Date(entry.servedAt!).toLocaleTimeString()}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => markAsServed(entry.number)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Served
                </button>
              )}
            </div>
          </div>
        ))}

        {queueEntries.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No one is currently in the queue
          </div>
        )}
      </div>
    </div>
  );
}

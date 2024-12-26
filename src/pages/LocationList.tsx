import React, { useState } from "react";
import { Link } from "react-router-dom";
import { user, updateDisplayName } from "../services/gun";
import { Plus, Settings, QrCode, User } from "lucide-react";
import { Location } from "../types/gun";
import Card from "../components/shared/Card";
import QRCodeModal from "./QRCodeModal";
import { useLocationList } from "../hooks/gun.hook";

export default function LocationList() {
  const [newDisplayName, setNewDisplayName] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const { locationIds, locationList } = useLocationList();

  const handleExportKeys = () => {
    const keys = localStorage.getItem("userKeys");
    if (keys) {
      const blob = new Blob([keys], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "take-a-number-keys.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);

    if (newDisplayName.trim()) {
      try {
        await updateDisplayName(newDisplayName.trim());
      } catch (error) {
        setUpdateError(
          error instanceof Error
            ? error.message
            : "Failed to update display name"
        );
      }
    }
  };

  const handleShowQRCode = (e: React.MouseEvent, location: Location) => {
    e.preventDefault(); // Prevent navigation
    setSelectedLocation(location);
    setIsQRModalOpen(true);
  };

  const isLocationManager = (location: Location) => {
    return user.is?.pub === location.createdBy;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4">
        {/* Account Settings Card */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Account Settings {locationIds.size}
              </h2>
            </div>
            <form onSubmit={handleUpdateDisplayName} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Display Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {updateError && (
                  <p className="mt-1 text-sm text-red-600">{updateError}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  Update Name
                </button>
                <button
                  type="button"
                  onClick={handleExportKeys}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Export Keys
                </button>
              </div>
            </form>
          </div>
        </Card>

        {/* Locations Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Locations</h1>
          <Link
            to="/location/create"
            className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Location
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locationList.map((location) => (
            <div key={location.id} className="relative">
              <Link to={`/location/${location.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {location.name}
                    </h3>
                    <div className="space-y-2">
                      <p className="text-gray-600">
                        Current number: {location.currentNumber || 1}
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <User className="w-4 h-4 mr-1" />
                        <span>
                          Manager: {location.creatorName}
                          {isLocationManager(location) && " (You)"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
              <button
                onClick={(e) => handleShowQRCode(e, location)}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                title="Show QR Code"
              >
                <QrCode className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedLocation && selectedLocation.id && (
        <QRCodeModal
          locationId={selectedLocation.id}
          locationName={selectedLocation.name}
          isOpen={isQRModalOpen}
          onClose={() => {
            setIsQRModalOpen(false);
            setSelectedLocation(null);
          }}
        />
      )}
    </div>
  );
}

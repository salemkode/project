import React, { useState } from "react";
import { Settings, User } from "lucide-react";

interface AdminControlsProps {
  locationName: string;
  creatorName: string;
  onUpdateName: (newName: string) => Promise<void>;
}

export default function AdminControls({
  locationName,
  creatorName,
  onUpdateName,
}: AdminControlsProps) {
  const [newName, setNewName] = useState(locationName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onUpdateName(newName.trim());
    }
  };

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Location Settings
      </h3>
      <div className="flex items-center text-sm text-gray-600 mb-4">
        <User className="w-4 h-4 mr-1" />
        <span>Location Manager: {creatorName} (You)</span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          placeholder="Location name"
        />
        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Update Name
        </button>
      </form>
    </div>
  );
}

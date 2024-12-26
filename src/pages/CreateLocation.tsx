import React, { useState } from "react";
import { locations } from "../services/gun/locations";
import { useNavigate } from "react-router-dom";

const CreateLocation: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [autoServeTime, setAutoServeTime] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const locationId = await locations.create(name, autoServeTime)
      navigate(`/location/${locationId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create location"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Location</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Location Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-2 border rounded"
            placeholder="Enter location name"
          />
        </div>

        <div>
          <label
            htmlFor="autoServeTime"
            className="block text-sm font-medium mb-1"
          >
            Auto-Serve Time (minutes)
          </label>
          <input
            id="autoServeTime"
            type="number"
            min="1"
            value={autoServeTime || ""}
            onChange={(e) =>
              setAutoServeTime(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="w-full p-2 border rounded"
            placeholder="Optional: Enter time in minutes"
          />
          <p className="text-sm text-gray-500 mt-1">
            Leave empty for manual serving, or enter minutes for auto-serve
          </p>
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={isLoading || !name}
          className={`w-full p-2 rounded text-white ${
            isLoading || !name ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isLoading ? "Creating..." : "Create Location"}
        </button>
      </form>
    </div>
  );
};

export default CreateLocation;
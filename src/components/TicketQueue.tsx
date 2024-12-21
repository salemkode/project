import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Ticket, Timer, ArrowLeft, Settings } from 'lucide-react';
import { user, locations } from '../services/gun';

interface QueueState {
  locationName: string;
  currentNumber: number;
  myNumber: number | null;
  error: string | null;
  createdBy: string | null;
}

export default function TicketQueue() {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<QueueState>({
    locationName: '',
    currentNumber: 1,
    myNumber: null,
    error: null,
    createdBy: null
  });

  const isCreator = user.is?.alias === state.createdBy;

  useEffect(() => {
    if (!locationId || !user.is) {
      setState(prev => ({ ...prev, error: 'Please log in to continue' }));
      return;
    }

    // Subscribe to location updates
    locations.get(locationId).on((data) => {
      if (data) {
        setState(prev => ({
          ...prev,
          locationName: data.name,
          currentNumber: data.currentNumber || 1,
          createdBy: data.createdBy,
          error: null
        }));
      } else {
        setState(prev => ({ ...prev, error: 'Location not found' }));
      }
    });

    // Get user's number for this location
    if (user.is) {
      user.get('myNumbers').get(locationId).on((number) => {
        setState(prev => ({ ...prev, myNumber: number }));
      });
    }

    return () => {
      locations.get(locationId).off();
      if (user.is) {
        user.get('myNumbers').get(locationId).off();
      }
    };
  }, [locationId]);

  // Admin function to update location name
  const updateLocationName = async (newName: string) => {
    if (!user.is) {
      setState(prev => ({ ...prev, error: 'Please log in to continue' }));
      return;
    }

    try {
      await locations.updateName(locationId!, newName.trim());
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to update location name' 
      }));
    }
  };

  // Regular user functions
  const takeNumber = async () => {
    if (!user.is) {
      setState(prev => ({ ...prev, error: 'Please log in to continue' }));
      return;
    }

    try {
      await locations.takeNumber(locationId!);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to take number' 
      }));
    }
  };

  const relinquishNumber = async () => {
    if (!user.is) {
      setState(prev => ({ ...prev, error: 'Please log in to continue' }));
      return;
    }

    try {
      await locations.relinquishNumber(locationId!);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to relinquish number' 
      }));
    }
  };

  // Admin Controls Component
  const AdminControls = () => {
    const [newName, setNewName] = useState(state.locationName);
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newName.trim()) {
        updateLocationName(newName.trim());
      }
    };

    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Location Settings
        </h3>
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
  };

  if (state.error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-red-50 rounded-lg p-6 text-center">
            <p className="text-red-600">{state.error}</p>
            <button
              onClick={() => navigate('/locations')}
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
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate('/locations')}
          className="mb-4 flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Locations
        </button>
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Ticket className="w-16 h-16 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{state.locationName}</h1>
            
            {state.myNumber ? (
              <div className="space-y-6">
                <div className="bg-green-50 rounded-lg p-6">
                  <p className="text-lg text-green-800 mb-2">Your number is</p>
                  <div className="text-5xl font-bold text-green-600 mb-2">
                    {state.myNumber}
                  </div>
                  <p className="text-sm text-green-700">Please wait for your turn</p>
                </div>
                <button
                  onClick={relinquishNumber}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Timer className="w-5 h-5" />
                  Relinquish Number
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <p className="text-lg text-blue-800 mb-2">Current number</p>
                  <div className="text-6xl font-bold text-blue-600 mb-2">
                    {state.currentNumber}
                  </div>
                  <p className="text-sm text-blue-700">Available to take</p>
                </div>
                <button
                  onClick={takeNumber}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Ticket className="w-5 h-5" />
                  Take a Number
                </button>
              </div>
            )}
            
            {isCreator && <AdminControls />}
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { locations, user } from '../../services/gun';
import { Plus, Settings } from 'lucide-react';
import { Location } from '../../types/gun';
import Button from '../shared/Button';
import Card from '../shared/Card';

export default function LocationList() {
  const [locationsList, setLocationsList] = useState<Location[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');

  useEffect(() => {
    // Subscribe to locations
    locations.getAll().map().on((data, id) => {
      if (data) {
        setLocationsList(prev => {
          const filtered = prev.filter(loc => loc.id !== id);
          return [...filtered, { ...data, id }];
        });
      }
    });

    // Get initial display name
    if (user.is) {
      user.get('profile').get('name').on((name) => {
        setDisplayName(name as string || '');
        setNewDisplayName(name as string || '');
      });
    }

    return () => {
      locations.getAll().map().off();
      if (user.is) {
        user.get('profile').get('name').off();
      }
    };
  }, []);

  const handleExportKeys = () => {
    const keys = localStorage.getItem('userKeys');
    if (keys) {
      const blob = new Blob([keys], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'take-a-number-keys.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newDisplayName.trim()) {
      await user.get('profile').get('name').put(newDisplayName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4">
        {/* Account Settings Card */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Account Settings</h2>
            </div>
            <form onSubmit={handleUpdateDisplayName} className="space-y-4">
              <input
                type="text"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="Display Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
          {locationsList.map((location) => (
            <Link key={location.id} to={`/location/${location.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{location.name}</h3>
                  <p className="text-gray-600">Current number: {location.currentNumber || 1}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 
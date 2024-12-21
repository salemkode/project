import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { locations } from '../../services/gun';
import Button from '../shared/Button';
import Card from '../shared/Card';

export default function CreateLocation() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Location name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const locationId = await locations.create(name.trim());
      if (!locationId) {
        throw new Error('Failed to create location');
      }
      navigate(`/location/${locationId}`);
    } catch (err) {
      console.error('Creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create location');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="max-w-md mx-auto">
        <Button
          variant="secondary"
          icon={ArrowLeft}
          onClick={() => navigate('/locations')}
          className="mb-4"
        >
          Back to Locations
        </Button>
        
        <Card title="Create New Location">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Location Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter location name"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Creating...' : 'Create Location'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
} 
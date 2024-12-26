import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { user } from '../../services/gun';
import Button from '../shared/Button';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onLogout: () => void;
}

export default function Navbar({ onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    // Subscribe to display name changes
    if (user.is) {
      user.get('profile').get('name').on((name) => {
        setDisplayName(name as string || user.is?.pub?.slice(0, 10) + '...' || 'Anonymous');
      });

      return () => {
        user.get('profile').get('name').off();
      };
    }
  }, []);

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/locations" className="text-xl font-semibold text-gray-800">
              Queue System
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Welcome, {displayName}
            </span>
            <Button
              variant="danger"
              icon={LogOut}
              onClick={() => {
                onLogout();
                navigate('/');
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
} 
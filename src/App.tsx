import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { generateNewUser, importUserFromKeys } from './services/gun';
import TicketQueue from './components/TicketQueue';
import LocationList from './components/locations/LocationList';
import CreateLocation from './components/locations/CreateLocation';
import Navbar from './components/layout/Navbar';
import KeyManagement from './components/auth/KeyManagement';

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const storedKeys = localStorage.getItem('userKeys');

    const initUser = async () => {
      try {
        if (storedKeys) {
          // Import existing keys
          const keyPair = JSON.parse(storedKeys);
          await importUserFromKeys(keyPair);
        } else {
          // Generate new keys
          const keyPair = await generateNewUser();
          localStorage.setItem('userKeys', JSON.stringify(keyPair));
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('userKeys');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initUser();
  }, []);

  const handleImportKeys = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const keyPair = JSON.parse(text);
      await importUserFromKeys(keyPair);
      localStorage.setItem('userKeys', JSON.stringify(keyPair));
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Import error:', error);
      alert('Invalid key file');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userKeys');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-blue-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto py-12 px-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Queue System</h1>
            <p className="text-gray-600">Please generate or import your keys to continue</p>
          </div>
          <KeyManagement
            onImportKeys={handleImportKeys}
            onGenerateNewKeys={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar onLogout={handleLogout} />
      {children}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthWrapper>
        <Routes>
          <Route path="/" element={<Navigate to="/locations" />} />
          <Route path="/locations" element={<LocationList />} />
          <Route path="/location/:locationId" element={<TicketQueue />} />
          <Route path="/location/create" element={<CreateLocation />} />
        </Routes>
      </AuthWrapper>
    </BrowserRouter>
  );
}

export default App;
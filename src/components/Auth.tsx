 import React, { useState } from 'react';
import { user } from '../lib/gun';

interface AuthProps {
  onAuth: (isAuthenticated: boolean) => void;
}

export default function Auth({ onAuth }: AuthProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    user.auth(username, password, (ack) => {
      if (ack.err) {
        setError(ack.err);
      } else {
        onAuth(true);
      }
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    user.create(username, password, (ack) => {
      if (ack.err) {
        setError(ack.err);
      } else {
        handleAuth(e);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Authentication</h2>
        <form className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username"
              className="w-full p-2 border rounded"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full p-2 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-4">
            <button
              onClick={handleAuth}
              className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Login
            </button>
            <button
              onClick={handleCreate}
              className="flex-1 bg-green-500 text-white p-2 rounded hover:bg-green-600"
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
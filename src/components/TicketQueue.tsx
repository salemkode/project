import React, { useEffect, useState } from 'react';
import { Ticket, Timer } from 'lucide-react';
import { gun, queueRef } from '../lib/gun';

interface QueueState {
  currentNumber: number;
  myNumber: number | null;
}

export default function TicketQueue() {
  const [state, setState] = useState<QueueState>({
    currentNumber: 1,
    myNumber: null,
  });

  useEffect(() => {
    // Subscribe to queue updates
    queueRef.on((data) => {
      if (data && data.currentNumber) {
        setState(prev => ({
          ...prev,
          currentNumber: data.currentNumber,
        }));
      }
    });

    // Initialize queue if it doesn't exist
    queueRef.once((data) => {
      if (!data || !data.currentNumber) {
        queueRef.put({ currentNumber: 1 });
      }
    });
  }, []);

  const takeNumber = () => {
    const numberToTake = state.currentNumber;
    setState(prev => ({ ...prev, myNumber: numberToTake }));
    queueRef.put({ currentNumber: numberToTake + 1 });
  };

  const relinquishNumber = () => {
    setState(prev => ({ ...prev, myNumber: null }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Ticket className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Queue System</h1>
          
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
        </div>
      </div>
    </div>
  );
}
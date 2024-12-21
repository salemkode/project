import React from 'react';
import Button from '../shared/Button';
import Card from '../shared/Card';
import { Key } from 'lucide-react';

interface KeyManagementProps {
  onImportKeys: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onGenerateNewKeys: () => void;
}

export default function KeyManagement({ onImportKeys, onGenerateNewKeys }: KeyManagementProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <Card title="Key Management" icon={Key}>
          <div className="space-y-4">
            <Button
              onClick={onGenerateNewKeys}
              className="w-full"
            >
              Generate New Keys
            </Button>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Import Keys
              </label>
              <input
                type="file"
                accept=".json"
                onChange={onImportKeys}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 